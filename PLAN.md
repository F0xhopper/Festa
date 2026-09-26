# Festa — v1 execution plan

## Status (2026-09-26)

Unreleased: a linked Matins note (Festa/Matins/<saint>.md, created on demand; a web link was not possible because Divinum Officium's Cloudflare blocks dated URLs) holding the Matins reading (the 1960 historical lesson, or the second-nocturn lessons on I and II class feasts) in Latin and English, from the Divinum Officium Breviary via scripts/matins.py; 291 of 372 observances have one, including every I and II class saint.

1.1.0 adds fasting and abstinence (1917 and 1983 rules) and the Epistle and Gospel references, generated from Missale Meum's Mass propers (Divinum Officium texts, nested submodule).

Phases 0–3 are built, tested and pushed. Phase 4 remains: live with it in the vault, check 2026 against a printed Ordo, publish a release, submit to the community list.

Where the build deviates from the plan below:

- **Week and season come from the data, not from Easter arithmetic.** Each bundled day carries a week key taken from Missale Meum's temporal cycle (`Pent17`, `Epi5`, `Quad6` …). Counting from Easter would have contradicted the day's own Mass in November, where the resumed Sundays after Epiphany and the always-final "XXIV Sunday after Pentecost" break the count. `src/seasons.ts` maps keys to labels; there is no `easter()`.
- **Local overrides.** `scripts/overrides.json` corrects one upstream rubric bug (St Joseph on Friday of Passion Week, 2027 and 2032) and renames days that upstream titles after one of their Masses (Christmas, All Souls, Our Lady on Saturday).
- **Divinum Officium** is Cloudflare-protected, so the automated second opinion is `tridentine_calendar` only.
- **`trans`** was dropped from the Python dependencies: it does not install under current uv and the calendar never imports it.
- **Callout redesigned after first use (1.0.x):** English title as heading, Latin as italic subtitle, one context line (class · week · Roman date), commemoration on its own line; colour word, Latin weekday and missal pages dropped from the callout (pages moved to a `feast_missal` property). Added a compact one-line layout, `[? … ?]` optional template segments, and refresh commands for one note or all daily notes. Unedited 1.0.0 templates are upgraded on load. Second pass: English on top, rank in words ("Third-class feast", "Second-class Ember day"), commemoration, then the Latin title and Roman date together in italics.
- **Settings tab** uses the classic `display()` API for Obsidian 1.5 compatibility. Lint warns that 1.13 prefers declarative settings; adopting it would force `minAppVersion` 1.13.
- **Extra modules**: `dates.ts` (UTC-free date maths), `note-text.ts` (pure frontmatter/callout helpers). `modals.ts` holds a generic `ConfirmModal`.
- **Tests**: 65 unit and fake-vault tests, plus a manual smoke test of the bundled `main.js` against a mocked Obsidian runtime using the real daily-note template (auto-stamp, simulated Templater rewrite, backfill, idempotence, out-of-range year).

---

Obsidian community plugin that stamps every daily note with the 1962 Roman calendar
identity of its day: title (Latin + English), class, colour, commemorations, season and
week, Roman-style date, hand-missal pages. Offline. Bundled data. No network at runtime.

All facts marked ✓ were verified on 2026-09-26 against live sources; anything else is design.

---

## 0. Fixed decisions

| Decision | Choice |
|---|---|
| v1 scope | Identity block only. Roadmap: 1.1 devotional rules · 1.2 fast/abstinence presets · 2.0 Collect/readings/Martyrology · 3.0 local calendars |
| Data source | Missale Meum ✓ MIT ✓ pushed 2026-09-21 ✓ Python ≥ 3.13 ✓. Generated offline, years 2020–2040, `en` + `la` (Latin titles exist in the package ✓, not on the public API ✓) |
| Cross-check | `tridentine_calendar` ✓ MIT (automated) + printed FSSP/Angelus Ordo (manual). Divinum Officium site is Cloudflare-gated ✓ → manual reference only |
| Plugin id / name | `festa` ✓ free / Festa |
| Licence | MIT. README credits Missale Meum, pins generator commit + date |
| Repo | `~/Projects/festa`. Never inside the vault (vault uses Obsidian Sync ✓) |
| Dev vault | `~/Documents/Eden's Main Brain Remote` ✓ · daily notes `Daily/YYYY-MM-DD.md` ✓ · template `Templates/Daily Note` ✓ · installed: calendar, templater, dataview, tracker, advanced-uri ✓ · Templater "trigger on file creation" currently off ✓ |
| Toolchain | Node 26 / npm 11 ✓ · Obsidian sample plugin (esbuild, eslint-plugin-obsidianmd) ✓ · Python 3.14 + uv ✓ · vitest |
| Min Obsidian | 1.5.0 · `isDesktopOnly: false` |
| Frontmatter | Keys namespaced by a prefix, default `feast` → `feast`, `feast_la`, `feast_class`, `feast_color`, `feast_comm`, `feast_season`, `feast_week` |
| Callout | Type `festa`, colour passed as metadata: `> [!festa|violet]` |
| Open (defaults chosen) | `manifest.author` = "<your name>" · `authorUrl` = GitHub profile. Both editable any time before release |

---

## 1. Repo layout

```
festa/
  manifest.json  versions.json  package.json  package-lock.json
  esbuild.config.mjs  tsconfig.json  eslint.config.mts  version-bump.mjs
  vitest.config.ts  styles.css  LICENSE  README.md  PLAN.md  .gitignore  .gitmodules
  src/
    main.ts            FestaPlugin: lifecycle, settings load/save, create hook, commands, public api
    settings.ts        FestaSettings, DEFAULT_SETTINGS, DEFAULT_TEMPLATES, FestaSettingTab
    types.ts           Colour, DayInfo, YearRow, Titles, Season …
    calendar.ts        lookup(dateISO): DayInfo | undefined   (bundled data + seasons + roman date)
    seasons.ts         easter(y), advent1(y), seasonOf(date), weekLabel(date, lang), weekdayLa(date)
    roman-date.ts      romanDate(date): { short, long }
    format.ts          renderCallout(info, settings), frontmatterFields(info, settings)
    stamp.ts           stampFile(app, file, info, settings, {force}) + insertAfterFrontmatter(data, block)
    daily-notes.ts     dateForFile(app, file, settings): string | null
    modals.ts          ConfirmBackfillModal
    data/
      titles.json      { "<observance id>": { "en": "...", "la": "..." } }
      years/2020.json … 2040.json
      meta.json        { "source": "missalemeum", "commit": "<sha>", "generated": "YYYY-MM-DD", "years": [2020, 2040] }
  scripts/
    generate.py        Missale Meum → src/data/*
    verify.py          bundled year vs live API vs tridentine_calendar + awkward-date table
    pyproject.toml     uv project for scripts (deps: requests, tridentine_calendar from git)
    VERIFIED.md        manual sign-off log per year checked
  tests/
    seasons.test.ts  roman-date.test.ts  calendar.test.ts  format.test.ts  stamp.test.ts
  vendor/missalemeum   git submodule, pinned commit
```

Rule: `calendar.ts`, `seasons.ts`, `roman-date.ts`, `format.ts`, `types.ts` and the
`insertAfterFrontmatter` helper import nothing from `obsidian`. Everything testable lives there.

---

## 2. Data

### 2.1 Upstream object model (✓ from `backend/api/kalendar/models.py`)

- `controller.get_calendar(year, lang) -> Calendar`; `Calendar.items()` yields `(date, Day)` for every day of the year.
- `Day.get_celebration_id() / get_celebration_name() / get_celebration_rank() / get_celebration_colors()`.
- `Day.get_tempora_id() / get_tempora_name()` — the feria/Sunday of the temporal cycle, may equal the celebration.
- `Day.get_commemorations() -> [Observance]`, `Day.get_displaced() -> [Observance]`, `Day.all`.
- `Observance.id` (e.g. `tempora:093-6:2:v`, `sancti:09-26:4:r`), `.rank` (1–4, date-adjusted), `.title`, `.colors` (`w r v g b p`).
- Missal pages: `api.constants.en.pages.PAGES` maps observance-id constant → `["Angelus Press p. N", "Father Lasance p. N", "Baronius Press p. N"]` ✓ (order fixed ✓).
- Live API confirms today: title "Ember Saturday of September", rank 2, colours `["v"]`, commemoration `sancti:09-26:4:r` "Sts. Cyprian & Justina", tags with the three page refs ✓.

### 2.2 Bundled schema

```jsonc
// src/data/titles.json — dictionary, ~450 ids, shared by all years
{ "tempora:093-6:2:v": { "en": "Ember Saturday of September", "la": "Sabbato Quattuor Temporum Septembris" },
  "sancti:09-26:4:r":  { "en": "Sts. Cyprian & Justina",      "la": "Ss. Cypriani et Justinæ Martyrum" } }

// src/data/years/2026.json — array, one row per day, positional to stay small
// [date, celebrationId, rank, colour, commemorations[], displaced[], pages[3]]
[ ["2026-09-26", "tempora:093-6:2:v", 2, "v", [["sancti:09-26:4:r", 4, "r"]], [], [785, 699, 708]] ]
// pages = [angelus, lasance, baronius], 0 when unknown
```

Keys are the full upstream id (rank and colour included) because that string is stable.
Rank and colour are still stored per day because upstream adjusts rank by date (Advent
ferias 17–23 Dec are class II). Budget: ≈ 30 KB/year + ≈ 60 KB titles ⇒ ≈ 700 KB in `main.js`.

### 2.3 `scripts/generate.py`

```
usage: generate.py --years 2020-2040 [--out src/data] [--vendor vendor/missalemeum/backend]
```
1. `sys.path.insert(0, vendor)`; `from api.controller import get_calendar`; `from api.constants.en.pages import PAGES`.
2. For each year: `cal_en = get_calendar(y, "en")`, `cal_la = get_calendar(y, "la")`.
3. For each `(date, day_en)`: `day_la = cal_la.get_day(date)`. Build `{obs.id: obs.title for obs in day_la.all}`.
   Celebration = `day_en.get_celebration_id()`; if `None` fall back to `get_tempora_id()`; if still `None` → hard error (should not happen).
   Row = `[iso, cel_id, rank, colours[0], [[c.id, c.rank, c.colors[0]] for c in commemorations], [d.id for d in displaced], pages(cel_id)]`.
   Register titles for celebration, commemorations and displaced in both languages.
4. `pages(id)`: parse ints from `PAGES.get(id, [])` by prefix name; missing → 0.
5. Invariants (fail loudly): every id has `en` and `la`; every year has 365/366 rows in date order; every colour ∈ `w r v g b p`; every rank ∈ 1–4.
6. Write JSON with `sort_keys=True, separators=(",", ":"), ensure_ascii=False`, trailing newline. Deterministic → clean git diffs.
7. `meta.json`: `commit = git -C vendor rev-parse HEAD`, `generated = today`, `years`, `languages`.

### 2.4 `scripts/verify.py`

```
usage: verify.py 2026 [--offline]
```
1. **Round-trip**: load bundled 2026, GET `https://www.missalemeum.com/en/api/v5/calendar/2026`, compare per date `title`, `rank`, `colors[0]`, commemoration titles, displaced. Print a diff table. Expected: empty (any diff = generator bug or upstream moved since the pinned commit).
2. **Second opinion**: `from tridentine_calendar.tridentine_calendar import LiturgicalYear` ✓; `LiturgicalYear(2026)[date]` → events ✓; take the first event with `liturgical_event and feast`; normalise both titles (lower, strip punctuation, `st`→`saint`, `ss`→`saints`, `bvm`→`blessed virgin mary`); `difflib.SequenceMatcher` ratio < 0.6 → print both. Expected: a few dozen naming differences, zero substantive ones.
3. **Awkward-date table** (for the manual Ordo check), printing date · weekday · celebration · rank · commemorations:
   every Sunday whose celebration id does not start with `tempora:`; 17–24 Dec; 26 Dec–1 Jan; every rank-2 feria (Ember days, Advent 17–23); 2 Feb, 19 Mar, 25 Mar, 24 Jun, 29 Jun, 15 Aug, 1–2 Nov, 8 Dec; the last three Sundays before Advent (resumed Sundays after Epiphany).
4. Record the sign-off in `scripts/VERIFIED.md` (year, date checked, Ordo edition, notes).

### 2.5 Environment

```bash
git submodule add https://github.com/mmolenda/missalemeum vendor/missalemeum
uv venv && uv pip install -e vendor/missalemeum/backend      # pulls weasyprint; wheels are pure Python
# fallback if weasyprint fails: uv pip install python-dateutil click icalendar mistune PyYAML trans
#   and run with PYTHONPATH=vendor/missalemeum/backend (calendar code never imports weasyprint)
uv pip install requests "tridentine_calendar @ git+https://github.com/joe-antognini/tridentine_calendar"
```

---

## 3. Pure modules

### 3.1 `types.ts`
```ts
export type Colour = "w" | "r" | "v" | "g" | "b" | "p";
export const COLOUR_NAME: Record<Colour, string> = { w: "white", r: "red", v: "violet", g: "green", b: "black", p: "rose" };
export type Season = "advent" | "christmas" | "epiphany" | "septuagesima" | "lent" | "passiontide" | "paschaltide" | "pentecost";
export interface Titles { [id: string]: { en: string; la: string } }
export type YearRow = [string, string, number, Colour, [string, number, Colour][], string[], [number, number, number]];
export interface Observance { id: string; title: { en: string; la: string }; rank: 1|2|3|4; colour: Colour }
export interface DayInfo {
  date: string; year: number; month: number; day: number; weekday: 0|1|2|3|4|5|6;
  celebration: Observance; commemorations: Observance[]; displaced: { id: string; title: { en: string; la: string } }[];
  pages: { angelus?: number; lasance?: number; baronius?: number };
  season: Season; seasonName: { en: string; la: string }; week: number | null; weekLabel: { en: string; la: string };
  weekdayLa: string; romanDate: { short: string; long: string };
}
```

### 3.2 `seasons.ts`
- `easter(y)`: Meeus/Jones/Butcher (Gregorian). Tests ✓ by hand: 2024-03-31, 2025-04-20, 2026-04-05, 2027-03-28, 2038-04-25.
- `advent1(y)`: latest Sunday ≤ 3 Dec (= Sunday nearest 30 Nov). Tests: 2024-12-01, 2025-11-30, 2026-11-29.
- Anchors from Easter E: Septuagesima E−63 · Ash Wednesday E−46 · Lent I E−42 · Passion Sunday E−14 · Palm Sunday E−7 · Ascension E+39 · Pentecost E+49 · Ember Saturday of Pentecost E+55 · Trinity E+56.
- Epiphany anchors: Epi1 = first Sunday strictly after 6 Jan (7–13 Jan).
- `seasonOf(d)` decision order (d in year Y, all dates as plain `{y,m,d}` — never `new Date(iso)`):
  1. d ≥ advent1(Y) → **advent**, week = ⌊(d−advent1)/7⌋+1
  2. d ≥ 25 Dec → **christmas** (25 Dec–1 Jan = "Octave of Christmas")
  3. d ≤ 5 Jan → **christmas**; d == 6 Jan or 7 Jan…Epi1−1 → **epiphany**, week = null ("after Epiphany")
  4. d ≥ Epi1 and d < Septuagesima → **epiphany**, week = ⌊(d−Epi1)/7⌋+1
  5. Septuagesima ≤ d < Ash Wednesday → **septuagesima**, week label by Sunday name (Septuagesima / Sexagesima / Quinquagesima)
  6. Ash Wednesday ≤ d < Lent I → **lent**, week = 0 ("after Ash Wednesday")
  7. Lent I ≤ d < Passion Sunday → **lent**, week = ⌊(d−LentI)/7⌋+1 (1–4)
  8. Passion Sunday ≤ d < E → **passiontide**, week 1 = Passion Week, week 2 = Holy Week
  9. E ≤ d ≤ E+55 → **paschaltide**, week = ⌊(d−E)/7⌋ (0 = Easter octave; 7 = Pentecost octave)
  10. E+56 ≤ d < advent1 → **pentecost**, week = ⌊(d−Pentecost)/7⌋ (Trinity Sunday week = 1; 2026-09-26 → 17 ✓)
- `weekLabel(d, lang)`: "17th week after Pentecost" / "Hebdomada XVII post Pentecosten"; "3rd week of Lent" / "Hebdomada III Quadragesimæ"; "Octave of Christmas"; "Holy Week"; "Easter Week"; "Whitsun Week"; "Septuagesima Week" …
- `seasonName`: en Advent · Christmastide · Time after Epiphany · Septuagesima · Lent · Passiontide · Paschaltide · Time after Pentecost / la Tempus Adventus · Tempus Nativitatis · Tempus Epiphaniæ · Tempus Septuagesimæ · Tempus Quadragesimæ · Tempus Passionis · Tempus Paschale · Tempus post Pentecosten.
- `weekdayLa`: Dominica · Feria II · Feria III · Feria IV · Feria V · Feria VI · Sabbato.

### 3.3 `roman-date.ts`
Constants per month: days, Nones (5; 7 in Mar/May/Jul/Oct), Ides (13; 15 in those months), genitive abbreviation (Ian. Feb. Mart. Apr. Mai. Iun. Iul. Aug. Sept. Oct. Nov. Dec.) and full genitive (Ianuarias … Decembres).
```
day == 1            → "Kal. <M>"
day == Nones        → "Non. <M>"        day == Nones−1 → "prid. Non. <M>"
day == Ides         → "Id. <M>"         day == Ides−1  → "prid. Id. <M>"
day == lastDay      → "prid. Kal. <M+1>"
1 < day < Nones−1   → "a.d. R(Nones−day+1) Non. <M>"
Nones < day < Ides−1→ "a.d. R(Ides−day+1) Id. <M>"
Ides < day < last   → "a.d. R(last−day+2) Kal. <M+1>"
Leap February: 24 Feb → "a.d. bis VI Kal. Mart."; 25–29 Feb computed as (day−1) with last=28.
```
Long form: "ante diem sextum Kalendas Octobris" (ordinal words tertium…undevicesimum). Tests: 09-26 → a.d. VI Kal. Oct. ✓ · 03-15 Id. Mart. · 03-07 Non. Mart. · 01-01 Kal. Ian. · 2026-02-28 prid. Kal. Mart. · 2028-02-24 a.d. bis VI Kal. Mart. · 2028-02-25 a.d. VI Kal. Mart. · 2028-02-29 prid. Kal. Mart. · 12-31 prid. Kal. Ian. · 05-02 a.d. VI Non. Mai. · 10-06 prid. Non. Oct.

### 3.4 `calendar.ts`
- `import titles from "./data/titles.json"`; years imported statically (esbuild inlines JSON; `resolveJsonModule: true`).
- `lookup(dateISO)`: validate `^\d{4}-\d{2}-\d{2}$`; year outside bundled range → `undefined`; binary/index lookup by day-of-year; assemble `DayInfo` with titles, `seasonOf`, `weekLabel`, `weekdayLa`, `romanDate`. Missing title id → throw (data invariant; caught by tests).
- `dataRange(): { from: number; to: number; commit: string; generated: string }` from `meta.json` (for the settings tab and README).

### 3.5 `format.ts`
Tokens: `{title}` `{title_alt}` `{title_la}` `{title_en}` `{class}` (I–IV) `{class_num}` `{colour}` (name) `{colour_code}` `{comm}` `{comm_alt}` `{comm_la}` `{comm_en}` `{displaced}` `{weekday_la}` `{week_label}` `{week_label_la}` `{week}` `{season}` `{season_la}` `{roman_date}` `{roman_date_long}` `{pages}` (`Angelus Press p. 785 · Baronius p. 708 · Lasance p. 699`) `{date}`.
`{title}`/`{comm}` = primary language per settings; `_alt` = the other language when `titleLanguage === "both"`, else empty.
Line rule: a template line that contains ≥ 1 token and whose tokens all resolved empty is dropped. Unknown token → left verbatim (visible, so the user notices).
Default templates (switching the language dropdown replaces the template only if it still equals the previous default):
```
both:
> [!festa|{colour}] {title_la}
> **{title_en}** · Class {class} · {colour}
> Comm. {comm_la} ({comm_en})
> {weekday_la} · {week_label} · {roman_date}
> Missal: {pages}

la:
> [!festa|{colour}] {title_la} · Classis {class}
> Comm. {comm_la}
> {weekday_la} · {week_label_la} · {roman_date}
> Missal: {pages}

en:
> [!festa|{colour}] {title_en} · Class {class} · {colour}
> Comm. {comm_en}
> {weekday_la} · {week_label} · {roman_date}
> Missal: {pages}
```
`frontmatterFields(info, s)` → `{ [p]: title_en, [p+"_la"]: title_la, [p+"_class"]: 2, [p+"_color"]: "violet", [p+"_comm"]: ["Sts. Cyprian & Justina"], [p+"_season"]: "Time after Pentecost", [p+"_week"]: 17 }` (omit `_comm` when empty, `_week` when null).
Golden test: 2026-09-26 with `both` renders exactly the five-line block above with today's real strings ✓.

### 3.6 `stamp.ts` (pure helper part)
`insertAfterFrontmatter(data, block)`: if `data` starts with `---\n` (or `---\r\n`), find the first line that is exactly `---` after it; insert `block + "\n\n"` after that line, collapsing to a single blank line before existing content. No frontmatter → `block + "\n\n" + data`. `hasMarker(data, prefix)` → frontmatter YAML contains key `prefix` **or** body contains `[!festa`. Tests: with fm / without fm / fm at EOF without trailing newline / CRLF / already stamped.

---

## 4. Obsidian layer

### 4.1 `daily-notes.ts`
- `dateForFile(app, file, settings)`: if `settings.folderOverride || settings.dateFormatOverride` → use those (folder prefix match + `moment(basename, format, true).isValid()`); else `getDateFromFile(file, "day")` from `obsidian-daily-notes-interface` ✓ (reads core Daily Notes or Periodic Notes settings). Return `"YYYY-MM-DD"` from the moment's own fields — never through `toDate()`/UTC.
- `isDailyNote(file)` = `dateForFile(...) !== null && file.extension === "md"`.
- `allDailyNotes(app)` = `getAllDailyNotes()` ✓ (or folder scan under override).

### 4.2 `stamp.ts` (Obsidian part)
```
stampFile(app, file, settings, { force=false }) → "stamped" | "skipped" | "no-date" | "out-of-range"
  date = dateForFile → null ⇒ "no-date"
  info = lookup(date) → undefined ⇒ "out-of-range"
  data = await app.vault.read(file); if (!force && hasMarker(data, prefix)) ⇒ "skipped"
  if (settings.insertFrontmatter) await app.fileManager.processFrontMatter(file, fm => { if (force) delete old keys; Object.assign(fm, frontmatterFields(info, settings)) })
  if (settings.insertCallout)   await app.vault.process(file, d => force ? replaceCallout(d, callout) : insertAfterFrontmatter(d, callout))
  ⇒ "stamped"
```
Reads the file, not the metadata cache, for idempotence, because the cache lags right after creation.

### 4.3 `main.ts`
- `onload`: load settings; `addSettingTab`; register commands; `this.app.workspace.onLayoutReady(() => registerEvent(vault.on("create", onCreate)))` so the startup index sweep never triggers stamping; expose `this.api = { lookup, renderCallout, frontmatterFields }` for Templater users (`app.plugins.plugins.festa.api`).
- `onCreate(file)`: `file instanceof TFile && extension === "md" && settings.autoInsert && isDailyNote(file)` → `setTimeout(settings.stampDelayMs=500)` → `stampFile`; then a **guard re-check** at +1500 ms: if the marker vanished (Templater rewrote the file with stale content), stamp once more. Result "out-of-range" → `Notice("Festa: no bundled data for <year>")`.
- Commands (ids prefixed `festa-`):
  1. **Insert feast for this note** — `checkCallback`: active file is a daily note. Result → Notice ("Stamped", "Already has a feast", "No bundled data for 2045").
  2. **Insert feast callout at cursor** — `editorCallback`: date = the note's date if daily note else today (local); inserts callout only, no frontmatter, no idempotence check.
  3. **Add feasts to all daily notes** — collects candidates (`allDailyNotes` minus stamped minus out-of-range), opens `ConfirmBackfillModal` ("Stamp 274 notes? 91 already stamped, 0 outside 2020–2040"), then stamps sequentially, progress Notice every 50, final Notice with counts. Sequential on purpose: two atomic writes per file, ~1 s per 100 files.
- No default hotkeys (community guideline).

### 4.4 `settings.ts`
| Setting | Type | Default | Notes |
|---|---|---|---|
| `titleLanguage` | dropdown both/la/en | both | swaps template if template == previous default |
| `template` | textarea (mono, 6 rows) + "Reset to default" | per language | tokens listed in description |
| `insertFrontmatter` | toggle | true | |
| `frontmatterPrefix` | text | `feast` | validated `^[a-z][a-z0-9_]*$` |
| `insertCallout` | toggle | true | |
| `autoInsert` | toggle | true | |
| `folderOverride` | text | "" | description shows detected folder/format from daily-notes interface |
| `dateFormatOverride` | text | "" | moment format |
| `stampDelayMs` | number (advanced) | 500 | |
| (info) | — | — | "Bundled data: 2020–2040, Missale Meum commit abc1234, generated 2026-09-27" |

### 4.5 `styles.css`
```css
.callout[data-callout="festa"] { --callout-color: 113, 113, 122; --callout-icon: lucide-church; }
.callout[data-callout="festa"][data-callout-metadata~="violet"] { --callout-color: 124, 58, 237; }
.callout[data-callout="festa"][data-callout-metadata~="green"]  { --callout-color: 22, 163, 74; }
.callout[data-callout="festa"][data-callout-metadata~="red"]    { --callout-color: 220, 38, 38; }
.callout[data-callout="festa"][data-callout-metadata~="white"]  { --callout-color: 161, 161, 170; }
.callout[data-callout="festa"][data-callout-metadata~="black"]  { --callout-color: 63, 63, 70; }
.callout[data-callout="festa"][data-callout-metadata~="rose"]   { --callout-color: 236, 72, 153; }
```
Check contrast in the default light and dark themes; "white" is rendered grey on purpose.

---

## 5. Build, dev loop, release plumbing

- `esbuild.config.mjs` from the sample plugin ✓ (`entryPoints: src/main.ts`, `format: cjs`, `target: es2021`, `outfile: main.js`). Change: `outfile = process.env.OBSIDIAN_PLUGIN_DIR ? join(dir, "main.js") : "main.js"`, and in dev mode also copy `manifest.json` + `styles.css` into that dir after each build. JSON imports are bundled natively.
- `npm run dev` → watch build into `<vault>/.obsidian/plugins/festa/`. Enable once in Settings → Community plugins. Reload with "Reload app without saving" or install the Hot Reload plugin.
- `tsconfig`: `resolveJsonModule: true`, `strict: true`, `lib: ["DOM", "ES2021"]`.
- `vitest.config.ts`: `environment: node`, include `tests/**/*.test.ts`; `obsidian` is never imported by tested files so no mocking.
- `package.json` scripts: `dev`, `build` (tsc noEmit + esbuild prod), `test` (vitest run), `lint`, `version` (sample's bump script), `data:generate`, `data:verify` (uv wrappers).
- `.gitignore`: `node_modules/ main.js .venv/ *.tgz .DS_Store` (do **not** ignore `src/data/`).

---

## 6. Execution order (checkpoints = commits)

### Day 1 — scaffold + data
| # | Step | Done when | Commit |
|---|---|---|---|
| 0.1 | `git init`; copy sample-plugin files; write `manifest.json`, `versions.json`, `LICENSE`, `.gitignore` | `npm run build` produces `main.js` | `scaffold: obsidian sample plugin` |
| 0.2 | `OBSIDIAN_PLUGIN_DIR` support in esbuild config; `npm run dev`; enable in vault | "Festa" shows in Community plugins and loads without console errors | `build: dev output into vault` |
| 1.1 | Submodule + uv env (§2.5) | `python -c "from api.controller import get_calendar"` works | `data: vendor missalemeum @ <sha>` |
| 1.2 | `generate.py` | 21 year files + titles + meta; invariants pass; rerun is byte-identical | `data: generate 2020–2040` |
| 1.3 | `verify.py` round-trip + second opinion | live diff empty for 2025–2027; tridentine disagreements reviewed | `data: verify script` |
| 1.4 | Manual Ordo check of the awkward-date table for 2026 (and 2027 if an Ordo is at hand) | `scripts/VERIFIED.md` written | `data: 2026 verified against <Ordo>` |

### Day 1 afternoon — pure modules
| # | Step | Done when | Commit |
|---|---|---|---|
| 2.1 | `types.ts`, `seasons.ts` + tests | boundaries for 2024–2027 pass | `seasons: temporal cycle` |
| 2.2 | `roman-date.ts` + tests | all cases in §3.3 pass | `roman-date` |
| 2.3 | `calendar.ts` + tests | every day 2020–2040 resolves; 2019/2041 → undefined | `calendar: bundled lookup` |
| 2.4 | `format.ts` + golden test | 2026-09-26 renders the exact mock | `format: callout + frontmatter` |
| 2.5 | `insertAfterFrontmatter` + `hasMarker` + tests | all cases in §3.6 pass | `stamp: pure helpers` |

### Day 2 — Obsidian layer
| # | Step | Done when | Commit |
|---|---|---|---|
| 3.1 | `daily-notes.ts` | console: `dateForFile` returns the date for `Daily/2026-09-26.md`, null for `TODO List.md` | `daily-notes wrapper` |
| 3.2 | `stampFile` | command 1 stamps a test note; second run → "skipped" | `stamp: obsidian writes` |
| 3.3 | create hook + guard re-check | Calendar click on a future date → stamped note; with Templater trigger on, still exactly one callout | `auto-stamp on create` |
| 3.4 | commands 2 + 3 with modal | backfill stamps `Daily/*`; rerun stamps 0 | `commands: cursor + backfill` |
| 3.5 | settings tab | every setting round-trips; language switch swaps default template | `settings` |
| 3.6 | `styles.css` | six colours legible in light + dark | `styles: liturgical colours` |
| 3.7 | manual QA script (§7) | all 10 pass | `qa: v1 checklist` (in PLAN or README) |

### Day 3 (half) — release
| # | Step | Done when | Commit |
|---|---|---|---|
| 4.1 | README (what, screenshot, settings, tokens, "no network", attribution + commit/date, roadmap, Templater API) | reads cleanly on GitHub | `docs: readme` |
| 4.2 | `npm run lint && npm test && npm run build`; `main.js` < 1 MB | all clean | `release: 1.0.0 prep` |
| 4.3 | `npm version 1.0.0`; push; GitHub release with `main.js`, `manifest.json`, `styles.css` | BRAT can install `you/festa` on another vault | tag `1.0.0` |
| 4.4 | Use it daily for ~2 weeks; fix annoyances as 1.0.x | no open bugs from own use | |
| 4.5 | PR to `obsidianmd/obsidian-releases` (`community-plugins.json`); answer bot/reviewer | merged | |
| 4.6 | Meanwhile build 1.1 (rosary, dedications, First Friday/Saturday, Marian antiphon) | | |

---

## 7. Manual QA script (Phase 3 exit)

1. Enable plugin → settings tab shows detected folder `Daily` and format `YYYY-MM-DD`.
2. Wi-Fi off. Calendar plugin → click **2026-10-04** → note opens with a green callout for the Sunday (class II Sunday outranks St Francis).
3. Click **2026-12-25** → white, Class I, "In Nativitate Domini" (Latin) / "Nativity of Our Lord" (English), pages present.
4. Click **2026-12-26** → red, St Stephen, week label "Octave of Christmas".
5. Run **Add feasts to all daily notes** → modal counts match; after: Dataview `TABLE feast, feast_class, feast_color FROM "Daily"` lists every note. Run again → 0 stamped.
6. Change template in settings (drop the pages line) → new note reflects it; old notes untouched.
7. Templater "trigger on file creation" **on**, template containing `<% tp.date.now() %>` → new note has both Templater output and exactly one callout, frontmatter intact.
8. Create `Daily/2045-01-01.md` → Notice "no bundled data for 2045", file untouched.
9. Phone via Sync: create tomorrow's note on the phone → stamped there (plugin is mobile-capable).
10. Console clean on load/unload; `npm run lint` clean; `main.js` < 1 MB.

---

## 8. Risks → mitigations

- **Templater rewrite race** → 500 ms delay + idempotent stamp + 1.5 s guard re-check; documented; Templater users can call `app.plugins.plugins.festa.api` instead.
- **Rubric errors upstream** → verify.py + manual Ordo sign-off in `VERIFIED.md`; file issues upstream; regenerate + patch release.
- **Latin title gaps** → generator fails loudly; patch by adding to a local `overrides.json` merged at generate time.
- **Bundle size** → dictionary encoding; ceiling 1 MB, measured in 4.2.
- **Timezone drift** → dates handled as `{y,m,d}` strings/fields only; test `2026-09-26` on a machine set to UTC−10 and UTC+12 (change system zone once).
- **Sync-created files** → idempotence; also skip stamping files created while `app.workspace.layoutReady` is false.
- **weasyprint install** → fallback dep list (§2.5).
- **Callout name collisions** → `festa`, not `feast`.
- **Frontmatter key collisions** → prefix setting.

## 9. Out of scope for v1 (explicit)
Rosary/dedication rules · fast & abstinence · holy days by country · Collect/readings/Martyrology · Divinum Officium links · local/national calendars · month view · re-stamp/force command · Luminous mysteries toggle · non-1962 rubric sets (1955, pre-1955).

## 10. Definition of done
- Clean install on a fresh vault: enable → create a daily note → stamped, offline.
- All tests green; lint clean; `main.js` < 1 MB; no console errors.
- 2026 signed off against a printed Ordo in `scripts/VERIFIED.md`.
- README states no network use and credits Missale Meum with commit + date.
- Tagged 1.0.0 release installable through BRAT.
