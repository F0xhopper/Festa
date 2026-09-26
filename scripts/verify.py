#!/usr/bin/env python3
"""Verify Festa's bundled data for one year.

Usage:
    uv run --project scripts python scripts/verify.py 2026 [--offline] [--no-awkward]

1. Round-trip: bundled data vs the live Missale Meum API (catches generator bugs
   or upstream changes since the pinned commit). Expected: no differences.
2. Second opinion: bundled celebration vs Joe Antognini's tridentine_calendar
   (independent implementation of the 1962 rubrics). Prints days where our
   celebration matches none of its liturgical events. Expect naming noise only.
3. Awkward dates: prints the days most likely to be wrong, for a manual check
   against a printed Ordo. Record the sign-off in scripts/VERIFIED.md.
"""
from __future__ import annotations

import argparse
import datetime as dt
import difflib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
API = "https://www.missalemeum.com/en/api/v5/calendar/{year}"
COLOUR = {"w": "white", "r": "red", "v": "violet", "g": "green", "b": "black", "p": "rose"}


def load(year: int):
    titles = json.loads((DATA / "titles.json").read_text())
    rows = json.loads((DATA / "years" / f"{year}.json").read_text())
    return titles, rows


def round_trip(year: int, titles, rows) -> int:
    import requests

    live = requests.get(API.format(year=year), timeout=60).json()
    live_by = {d["id"]: d for d in live}
    overrides = json.loads((Path(__file__).parent / "overrides.json").read_text())
    diffs = 0
    for iso, cel, rank, colour, comms, displaced, _pages, _wk in rows:
        l = live_by.get(iso)
        if iso in overrides:
            print(f"  {iso}: local override (expected to differ): {overrides[iso]['reason'][:80]}")
            continue
        if l is None:
            print(f"  {iso}: missing from live API"); diffs += 1; continue
        ours = {
            "title": titles[cel]["en"],
            "rank": rank,
            "colour": colour,
            "comms": [titles[c[0]]["en"] for c in comms],
            "displaced": [titles[d]["en"] for d in displaced],
        }
        theirs = {
            "title": l["title"],
            "rank": l["rank"],
            "colour": (l.get("colors") or ["?"])[0],
            "comms": [c["title"] for c in l.get("commemorations", [])],
            "displaced": [c["title"] for c in l.get("displaced", [])],
        }
        for k in ours:
            if ours[k] != theirs[k]:
                print(f"  {iso} {k}: bundled={ours[k]!r} live={theirs[k]!r}")
                diffs += 1
    print(f"round-trip {year}: {diffs} difference(s) across {len(rows)} days")
    return diffs


def norm(s: str) -> str:
    s = s.lower()
    s = re.sub(r"\bsts?\b\.?", "saint", s)
    s = re.sub(r"\bss\b\.?", "saints", s)
    s = s.replace("b. v. m.", "blessed virgin mary").replace("bvm", "blessed virgin mary")
    s = re.sub(r"[^a-z ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def similar(a: str, b: str) -> bool:
    a, b = norm(a), norm(b)
    if not a or not b:
        return False
    if a in b or b in a:
        return True
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.6


def second_opinion(year: int, titles, rows) -> int:
    try:
        from tridentine_calendar.tridentine_calendar import LiturgicalYear
    except ImportError:
        print("second opinion: tridentine_calendar not installed, skipped")
        return 0
    years = {y: LiturgicalYear(y) for y in (year, year + 1)}

    def events(d: dt.date):
        for ly in years.values():
            try:
                return [e for e in ly[d] if e.liturgical_event]
            except KeyError:
                continue
        return []

    flagged = 0
    for iso, cel, rank, _c, comms, _d, _p, _wk in rows:
        d = dt.date.fromisoformat(iso)
        ev = events(d)
        ours = titles[cel]["en"]
        if rank == 4 and ours.lower().startswith("feria"):
            continue  # plain ferias: naming differs everywhere, nothing to learn
        if not ev:
            continue
        names = [e.name for e in ev]
        if not any(similar(ours, n) for n in names):
            print(f"  {iso} {d:%a}: bundled={ours!r} [{rank}]  tridentine={names}")
            flagged += 1
    print(f"second opinion {year}: {flagged} day(s) to eyeball")
    return flagged


def awkward(year: int, titles, rows) -> None:
    fixed = {"02-02", "03-19", "03-25", "06-24", "06-29", "08-15", "11-01", "11-02", "12-08"}
    sundays = [r for r in rows if dt.date.fromisoformat(r[0]).weekday() == 6]
    last_three = {r[0] for r in [s for s in sundays if s[0] < advent1(year).isoformat()][-3:]}
    print(f"\nawkward dates {year} (check against a printed Ordo):")
    print(f"  {'date':<10} {'day':<3}  {'class':<5} {'colour':<6}  celebration  [commemorations]")
    for iso, cel, rank, colour, comms, displaced, _p, _wk in rows:
        d = dt.date.fromisoformat(iso)
        md = iso[5:]
        reason = (
            (d.weekday() == 6 and not cel.startswith("tempora:"))
            or ("12-17" <= md <= "12-31") or md == "01-01"
            or (rank == 2 and d.weekday() != 6 and cel.startswith("tempora:"))
            or md in fixed or iso in last_three or displaced
        )
        if reason:
            c = "; ".join(titles[x[0]]["en"] for x in comms)
            dsp = f"  displaced: {', '.join(titles[x]['en'] for x in displaced)}" if displaced else ""
            print(f"  {iso} {d:%a}  {rank:<5} {COLOUR[colour]:<6}  {titles[cel]['en']}"
                  + (f"  [{c}]" if c else "") + dsp)


def advent1(year: int) -> dt.date:
    d = dt.date(year, 12, 3)
    return d - dt.timedelta(days=(d.weekday() + 1) % 7)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("year", type=int)
    ap.add_argument("--offline", action="store_true", help="skip the live API round-trip")
    ap.add_argument("--no-awkward", action="store_true")
    a = ap.parse_args()
    titles, rows = load(a.year)
    bad = 0 if a.offline else round_trip(a.year, titles, rows)
    second_opinion(a.year, titles, rows)
    if not a.no_awkward:
        awkward(a.year, titles, rows)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
