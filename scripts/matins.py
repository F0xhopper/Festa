"""Extract the historical Matins lessons for an observance from the Divinum Officium Breviary.

Under the 1960 rubrics, first- and second-class feasts read the three second-nocturn lessons
(Lectio4-6), and third-class feasts and commemorated saints read the single shortened
"historical" lesson (Lectio94). Only proper text is kept: lessons that fall back on the
Common are generic and say nothing about the saint, so they are skipped.
"""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

HORAS = (Path(__file__).resolve().parent.parent / "vendor" / "missalemeum" / "backend" / "resources"
         / "divinum-officium" / "web" / "www" / "horas")
LANG_DIR = {"la": "Latin", "en": "English"}
APPLIES = re.compile(r"1960|innovata")
SECTION = re.compile(r"^\[([^\]]+)\]([^\n]*)\n(.*?)(?=^\[|\Z)", re.M | re.S)
COND_LINE = re.compile(r"^\((sed )?([^)]*)\)\s*$")


@lru_cache(maxsize=None)
def sections(rel: str, lang: str) -> dict[str, str]:
    path = HORAS / LANG_DIR[lang] / f"{rel}.txt"
    if not path.exists():
        if lang != "la":
            latin = HORAS / "Latin" / f"{rel}.txt"
            first = latin.read_text(encoding="utf-8", errors="replace").lstrip().split("\n", 1)[0].strip() if latin.exists() else ""
            if first.startswith("@") and not SECTION.search(latin.read_text(encoding="utf-8", errors="replace")):
                return sections(first[1:].split(":")[0], lang)
        return {}
    text = path.read_text(encoding="utf-8", errors="replace")
    first = text.lstrip().split("\n", 1)[0].strip()
    if first.startswith("@") and not SECTION.search(text):
        return sections(first[1:].split(":")[0], lang)  # whole file is a pointer, e.g. "@Sancti/06-28"
    out: dict[str, str] = {}
    chosen: dict[str, bool] = {}
    for name, cond, body in SECTION.findall(text):
        cond = cond.strip()
        if cond and not APPLIES.search(cond):
            continue
        # A section conditioned on the 1960 rubrics beats an unconditional one.
        if name in out and chosen.get(name) and not cond:
            continue
        out[name] = body
        chosen[name] = bool(cond)
    return out


def resolve(rel: str, section: str, lang: str, depth: int = 0) -> tuple[str, bool]:
    """Return (text, from_common). Follows @references and applies rubric conditions for 1960."""
    body = sections(rel, lang).get(section)
    if body is None and lang != "la":
        # Translations inherit structure from the Latin: follow its pointers in this language.
        latin = sections(rel, "la").get(section)
        if latin and all(l.startswith(("@", "(")) for l in latin.split("\n") if l.strip()):
            body = latin
    if body is None or depth > 6:
        return "", False
    lines: list[str] = []
    from_common = rel.startswith("Commune/")
    skip_next = False
    raw = body.split("\n")
    for i, line in enumerate(raw):
        if skip_next:
            skip_next = False
            continue
        m = COND_LINE.match(line.strip())
        if m:
            sed, cond = m.group(1), m.group(2)
            applies = bool(APPLIES.search(cond))
            if sed:
                if applies:
                    if lines:
                        lines.pop()
                else:
                    skip_next = True
            elif re.search(r"omitt", cond) and applies and lines:
                lines.pop()
            continue
        if line.startswith("@"):
            ref = line[1:].strip()
            ref = re.sub(r"\s+in \d+ loco.*$", "", ref)
            path, _, sec = ref.partition(":")
            target_rel = path or rel
            sec = sec.split(":")[0]  # drop substitutions such as ":s/$/~/"
            target_sec = (sec or section).rstrip("_") or section
            text, common = resolve(target_rel, target_sec, lang, depth + 1)
            from_common = from_common or common or target_rel.startswith("Commune/")
            if text:
                lines.append(text)
            continue
        if line[:1] in "&$!_~" or not line.strip():
            continue
        lines.append(line.strip().replace("~(", "(").replace("~", "").strip())
    return "\n".join(lines).strip(), from_common


def horas_file(obs_id: str) -> str | None:
    kind, code = obs_id.split(":")[0:2]
    folder = {"sancti": "Sancti", "tempora": "Tempora"}.get(kind)
    if not folder:
        return None
    for candidate in dict.fromkeys([code, re.sub(r"(m\d|[a-z]+)$", "", code)]):
        if (HORAS / "Latin" / folder / f"{candidate}.txt").exists():
            return f"{folder}/{candidate}"
    return None


MAX_LESSON = 3000  # longer sections are older multi-lesson texts that pointers pull in whole


def proper_names(rel: str, names: list[str], lang: str) -> list[str]:
    """The named lessons that exist and are proper to the day (not borrowed from the Common)."""
    out = []
    for n in names:
        text, common = resolve(rel, n, lang)
        if text and not common and len(text) <= MAX_LESSON:
            out.append(n)
    return out


ALL_LESSONS = [f"Lectio{i}" for i in range(1, 7)]
SECOND_NOCTURN = ["Lectio4", "Lectio5", "Lectio6"]
FIRST_NOCTURN = ["Lectio1", "Lectio2", "Lectio3"]


def pick(rel: str, rank: int) -> tuple[str, list[str]]:
    """Choose which lesson sections are read, using the Latin (the reference text)."""
    if rel.endswith("r"):
        # A 1960 variant file lists exactly the lessons read that day.
        got = proper_names(rel, ALL_LESSONS, "la")
        if got:
            return rel, got
        base = rel[:-1]
        if not (HORAS / "Latin" / f"{base}.txt").exists():
            return rel, []
        rel = base
    if rank >= 3:
        # The 1960 shortened lesson, then the history simple feasts keep in lessons 2-3.
        order = [["Lectio94"], ["Lectio2", "Lectio3"], SECOND_NOCTURN, FIRST_NOCTURN]
    else:
        order = [SECOND_NOCTURN, FIRST_NOCTURN]
    for names in order:
        got = proper_names(rel, names, "la")
        if got:
            return rel, got
    return rel, []


def texts(rel: str, names: list[str], lang: str) -> list[str]:
    out = []
    for n in names:
        text, common = resolve(rel, n, lang)
        if text and not common and len(text) <= MAX_LESSON:
            out.append(text)
    return out


def lesson(obs_id: str, rank: int) -> dict[str, str] | None:
    """{"la": ..., "en": ...} with lessons separated by blank lines, or None."""
    rel = horas_file(obs_id)
    if not rel:
        return None
    rel, names = pick(rel, rank)
    if not names:
        return None
    out = {"la": "\n\n".join(texts(rel, names, "la")), "en": "\n\n".join(texts(rel, names, "en"))}
    if not out["en"]:
        # The translation may lack the shortened lesson; fall back to its own full lessons.
        for group in (SECOND_NOCTURN, FIRST_NOCTURN):
            en = texts(rel, group, "en")
            if en:
                out["en"] = "\n\n".join(en)
                break
    if not out["en"]:
        del out["en"]
    return out
