#!/usr/bin/env python3
"""Generate Festa's bundled 1962 calendar data from Missale Meum.

Usage:
    uv run --project scripts python scripts/generate.py --years 2020-2040

Writes:
    src/data/titles.json      observance id -> {"en": ..., "la": ...}
    src/data/years/<y>.json   one positional row per day
    src/data/meta.json        provenance (upstream commit, generation date, range)

Row format:
    [date, celebrationId, rank, colour, [[commId, rank, colour], ...], [displacedId, ...], [angelus, lasance, baronius],
     weekKey, readingsIndex, flags]
Page numbers are 0 when unknown. weekKey names the Sunday that governs the week in the
temporal cycle ("Pent17", "Epi5", "Quad6", "Adv3", "Pasc0" …), or "Nat" / "Epi0" for the
Christmas octave and the days between Epiphany and its first Sunday. readingsIndex points into
src/data/readings.json ({"en"|"la": {"e": epistle, "g": gospel, "l": [lessons]}}), -1 when the day
has no Mass readings. flags: "E" on Ember days (even when a feast outranks the Ember day).
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_VENDOR = ROOT / "vendor" / "missalemeum" / "backend"
DEFAULT_OUT = ROOT / "src" / "data"
OVERRIDES = Path(__file__).resolve().parent / "overrides.json"
LANGS = ("en", "la")
COLOURS = set("wrvgbp")
PAGE_ORDER = ("Angelus Press", "Father Lasance", "Baronius Press")


def fail(msg: str) -> None:
    print(f"generate.py: {msg}", file=sys.stderr)
    sys.exit(1)


def parse_years(spec: str) -> list[int]:
    if "-" in spec:
        a, b = spec.split("-", 1)
        return list(range(int(a), int(b) + 1))
    return [int(spec)]


def pages_for(pages_table: dict, obs_id: str) -> list[int]:
    tags = pages_table.get(obs_id, [])
    out = []
    for name in PAGE_ORDER:
        page = 0
        for tag in tags:
            m = re.fullmatch(rf"{re.escape(name)} p\. (\d+)", tag)
            if m:
                page = int(m.group(1))
        out.append(page)
    return out


def id_rank(obs_id: str) -> int:
    rank = int(obs_id.split(":")[2])
    if rank not in (1, 2, 3, 4):
        fail(f"bad rank in id {obs_id}")
    return rank


def id_colour(obs_id: str) -> str:
    c = obs_id.split(":")[3][0]
    if c not in COLOURS:
        fail(f"bad colour in id {obs_id}")
    return c


WEEK_RE = re.compile(r"^tempora:([A-Za-z]+\d*)-\d")


def week_key(cal, date_: dt.date) -> str:
    md = (date_.month, date_.day)
    if md >= (12, 25) or md <= (1, 5):
        return "Nat"
    if md == (12, 24):
        return "Adv4"
    sunday = date_ - dt.timedelta(days=(date_.weekday() + 1) % 7)
    week = [sunday + dt.timedelta(days=i) for i in range(7)]
    for d in [sunday, date_, *week]:
        if d.year != date_.year or (d.month, d.day) >= (12, 25):
            continue
        tid = cal.get_day(d).get_tempora_id()
        m = WEEK_RE.match(tid or "")
        if m:
            return m.group(1)
    if md <= (1, 13):
        return "Epi0"
    fail(f"{date_}: cannot determine week key")
    return ""


REF_LINE = re.compile(r"^\*([^*]+)\*$", re.M)
CITATION = re.compile(r"^(?:[1-4] ?)?[A-Z][A-Za-zæ]+\.?,? ?\d+[:,. ] ?\d+")


def clean_ref(ref: str) -> str:
    ref = ref.strip().rstrip(".;,")
    ref = re.sub(r"^((?:[1-4] ?)?[A-Z][A-Za-zæ]+)\.?,? ", r"\1 ", ref)  # "Matt. 26", "4 Kings, 5"
    ref = re.sub(r"(\d+)\. ?(\d)", r"\1:\2", ref)  # "John 18. 1-40"
    ref = re.sub(r"^((?:[1-4] ?)?[A-Z][A-Za-zæ]+ \d+), ?(\d)", r"\1:\2", ref)  # "Judith 13, 22-25"
    return ref.replace("-", "–")


def refs(body: str) -> list[str]:
    return [clean_ref(m) for m in REF_LINE.findall(body) if CITATION.match(m.strip())]


def labelled_lessons(body: str) -> list[str]:
    """Good Friday: citations that directly follow a "... Lesson" heading."""
    out, prev = [], ""
    for m in REF_LINE.findall(body):
        if CITATION.match(m.strip()) and re.search(r"Lesson|Lectio", prev):
            out.append(clean_ref(m))
        prev = m
    return out


def readings_of(proper) -> dict:
    secs = {sec["id"]: sec["body"] for sec in proper.serialize()}
    first = lambda key: (refs(secs.get(key, "")) or [""])[0]
    lessons = [first(k) for k in sorted(k for k in secs if re.fullmatch(r"LectioL\d", k))]
    if "Lectiones" in secs:
        lessons += labelled_lessons(secs["Lectiones"])
    gospel = first("Evangelium") or first("Passio")
    return {"e": first("Lectio"), "g": gospel, "l": [x for x in lessons if x]}


def day_readings(date_: dt.date) -> dict | None:
    from api.controller import get_proper_by_date
    try:
        vern, latin = get_proper_by_date(date_, "en")[0]
    except Exception:
        return None
    r = {"en": readings_of(vern), "la": readings_of(latin)}
    if not (r["en"]["e"] or r["en"]["g"] or r["en"]["l"]):
        return None
    return r


def colour_of(colors, where: str) -> str:
    if not colors:
        fail(f"no colour for {where}")
    c = colors[0]
    if c not in COLOURS:
        fail(f"unknown colour {c!r} for {where}")
    return c


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default="2020-2040")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--vendor", type=Path, default=DEFAULT_VENDOR)
    args = ap.parse_args()

    sys.path.insert(0, str(args.vendor))
    from api.controller import get_calendar  # noqa: E402
    from api.constants.en.pages import PAGES  # noqa: E402

    years = parse_years(args.years)
    readings_table: list[dict] = []
    readings_index: dict[str, int] = {}
    raw_overrides = json.loads(OVERRIDES.read_text())
    overrides = {k: v for k, v in raw_overrides.items() if not k.startswith("_")}
    title_overrides = raw_overrides.get("_titles", {})
    titles: dict[str, dict[str, str]] = {}
    (args.out / "years").mkdir(parents=True, exist_ok=True)

    def readings_ref(r: dict | None) -> int:
        if r is None:
            return -1
        key = json.dumps(r, sort_keys=True, ensure_ascii=False)
        if key not in readings_index:
            readings_index[key] = len(readings_table)
            readings_table.append(r)
        return readings_index[key]

    def remember(obs_id: str, lang: str, title: str | None) -> None:
        if not title:
            fail(f"empty {lang} title for {obs_id}")
        titles.setdefault(obs_id, {})
        prev = titles[obs_id].get(lang)
        if prev is not None and prev != title:
            fail(f"conflicting {lang} titles for {obs_id}: {prev!r} vs {title!r}")
        titles[obs_id][lang] = title

    for year in years:
        cals = {lang: get_calendar(year, lang) for lang in LANGS}
        rows = []
        for date_, day in cals["en"].items():
            iso = date_.isoformat()
            cel_id = day.get_celebration_id() or day.get_tempora_id()
            if not cel_id:
                fail(f"{iso}: no celebration or tempora")
            rank = day.get_celebration_rank()
            if rank not in (1, 2, 3, 4):
                fail(f"{iso}: bad rank {rank!r}")
            colour = colour_of(day.get_celebration_colors(), iso)
            comms = day.get_commemorations()
            displaced = day.get_displaced()

            for lang in LANGS:
                d = cals[lang].get_day(date_)
                by_id = {o.id: o.title for o in d.all}
                by_id.update({o.id: o.title for o in d.get_displaced()})
                name = d.get_celebration_name() or d.get_tempora_name()
                remember(cel_id, lang, name)
                for o in comms:
                    remember(o.id, lang, by_id.get(o.id))
                for o in displaced:
                    remember(o.id, lang, by_id.get(o.id))

            rows.append([
                iso,
                cel_id,
                rank,
                colour,
                [[o.id, o.rank, colour_of(o.colors, f"{iso} comm {o.id}")] for o in comms],
                [o.id for o in displaced],
                pages_for(PAGES, cel_id),
                week_key(cals["en"], date_),
                readings_ref(day_readings(date_)),
                "E" if any("Ember" in (o.title or "") for o in [*day.all, *displaced]) else "",
            ])

        for i, row in enumerate(rows):
            ov = overrides.get(row[0])
            if ov is None:
                continue
            ids = [ov["celebration"], *ov["commemorations"], *ov["displaced"]]
            for obs_id in ids:
                if obs_id not in titles:
                    fail(f"override {row[0]}: unknown observance {obs_id}")
            rows[i] = [
                row[0],
                ov["celebration"],
                id_rank(ov["celebration"]),
                id_colour(ov["celebration"]),
                [[c, id_rank(c), id_colour(c)] for c in ov["commemorations"]],
                list(ov["displaced"]),
                pages_for(PAGES, ov["celebration"]),
                row[7],
                row[8],
                row[9],
            ]
            print(f"  override {row[0]}: {ov['celebration']}")

        expected = 366 if dt.date(year, 12, 31).timetuple().tm_yday == 366 else 365
        if len(rows) != expected:
            fail(f"{year}: {len(rows)} rows, expected {expected}")
        if [r[0] for r in rows] != sorted(r[0] for r in rows):
            fail(f"{year}: rows out of order")
        write_json(args.out / "years" / f"{year}.json", rows, rows_per_line=True)
        print(f"{year}: {len(rows)} days")

    write_json(args.out / "readings.json", readings_table, rows_per_line=True)
    print(f"readings: {len(readings_table)} distinct sets")

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from matins import lesson  # noqa: E402

    ranks: dict[str, int] = {}
    for y in years:
        for row in json.loads((args.out / "years" / f"{y}.json").read_text()):
            ranks.setdefault(row[1], row[2])
            for c in row[4]:
                ranks.setdefault(c[0], c[1])
    matins = {}
    for obs_id, rank in sorted(ranks.items()):
        if obs_id.startswith("sancti:") or (obs_id.startswith("tempora:") and rank == 1):
            found = lesson(obs_id, rank)
            if found:
                matins[obs_id] = found
    write_json(args.out / "matins.json", matins)
    print(f"matins lessons: {len(matins)}")

    for obs_id, repl in title_overrides.items():
        if obs_id not in titles:
            fail(f"title override for unknown id {obs_id}")
        titles[obs_id].update(repl)
    for obs_id, t in titles.items():
        for lang in LANGS:
            if lang not in t:
                fail(f"{obs_id} missing {lang} title")
    write_json(args.out / "titles.json", dict(sorted(titles.items())))

    commit = subprocess.run(
        ["git", "-C", str(args.vendor), "rev-parse", "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    write_json(args.out / "meta.json", {
        "source": "Missale Meum (https://github.com/mmolenda/missalemeum), MIT",
        "commit": commit,
        "generated": dt.date.today().isoformat(),
        "years": [years[0], years[-1]],
        "languages": list(LANGS),
    })
    index = ["// Generated by scripts/generate.py. Do not edit.", "import type { YearRow } from \"../types\";"]
    for y in years:
        index.append(f"import y{y} from \"./years/{y}.json\";")
    index.append("")
    index.append("export const YEARS: Record<number, YearRow[]> = {")
    for y in years:
        index.append(f"\t{y}: y{y} as unknown as YearRow[],")
    index.append("};")
    (args.out / "index.ts").write_text("\n".join(index) + "\n", encoding="utf-8")
    print(f"titles: {len(titles)}  commit: {commit[:7]}")


def write_json(path: Path, data, rows_per_line: bool = False) -> None:
    if rows_per_line:
        body = "[\n" + ",\n".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in data) + "\n]\n"
    else:
        body = json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    path.write_text(body, encoding="utf-8")


if __name__ == "__main__":
    main()
