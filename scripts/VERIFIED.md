# Data verification log

Each bundled year is checked three ways (see `scripts/verify.py`):

1. **Round-trip** against the live Missale Meum API. Must report 0 differences, apart from local overrides.
2. **Second opinion** against Joe Antognini's `tridentine_calendar`. Differences are reviewed by eye; almost all are naming ("Lady Day" vs "Annunciation") or the other calendar listing a commemorated saint first.
3. **Awkward dates** against a printed Ordo (FSSP or Angelus Press): Sundays displacing feasts, transfers, Ember days, Christmas octave, the resumed Sundays after Epiphany.

| Year | Round-trip | Second opinion | Printed Ordo | Date | Notes |
|---|---|---|---|---|---|
| 2025 | 0 diffs | reviewed, naming only | not yet | 2026-09-26 | |
| 2026 | 0 diffs | reviewed, naming only | not yet | 2026-09-26 | Awkward-date table read against the 1960 rubrics: Christmas octave, Ember weeks, All Souls, resumed Epiphany Sundays in November all correct |
| 2027 | 0 diffs (1 override) | reviewed, naming only | not yet | 2026-09-26 | St Joseph on Friday of Passion Week fixed locally, see `overrides.json` |

## Local overrides

| Date | Upstream | Bundled | Why |
|---|---|---|---|
| 2027-03-19, 2032-03-19 | Feria VI of Passion Week, St Joseph displaced | St Joseph, class I, comm. of the feria | Upstream's Passion Friday rule returns before checking precedence. A class I feast outranks a class III Lenten feria. To be reported upstream. |

## Upstream behaviour reviewed and accepted

- St Matthias moves to 25 February in leap years.
- All Souls on a Sunday moves to Monday.
- Vigil of St Lawrence is omitted when 10 August is a Sunday, and replaced by Our Lady on Saturday when 9 August is a Saturday. The second is upstream's reading of the rubrics and is worth confirming against an Ordo for 2025, 2031 and 2036.
