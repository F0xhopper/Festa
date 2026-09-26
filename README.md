# Festa

Festa adds the traditional Roman calendar to your Obsidian daily notes. Each daily note gets the feast of the day according to the 1962 Missal: its English and Latin title, its rank, commemorations, the week of the liturgical year and the Roman-style date, in a callout tinted with the liturgical colour of the day.

Everything is bundled with the plugin. It works offline, on desktop and mobile, and never contacts a server.

```markdown
> [!festa|violet] Ember Saturday of September
> Second-class Ember day · 17th week after Pentecost
> Commemoration: Sts. Cyprian & Justina
> *Sabbato Quattuor Temporum Septembris · a.d. VI Kal. Oct.*
```

```markdown
> [!festa|white] St. Jerome
> Third-class feast · 18th week after Pentecost
> *S. Hieronymi Presbyteri Confessoris et Ecclesiæ Doctoris · prid. Kal. Oct.*
```

The callout is violet, green, red, white, black or rose, following the colour of the day. A compact one-line layout is also available:

```markdown
> [!festa|violet] Ember Saturday of September · Second-class Ember day · Comm. Sts. Cyprian & Justina
```

## Installing

Festa is not yet in Obsidian's community plugin list. Until it is, install it one of these two ways.

**With BRAT** (updates automatically):

1. Install and enable the **BRAT** community plugin.
2. Run the command **BRAT: Add a beta plugin for testing** and enter `F0xhopper/Festa`.
3. Enable **Festa** under Settings, then Community plugins.

**By hand:**

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/F0xhopper/Festa/releases/latest).
2. Put them in a folder called `festa` inside your vault's `.obsidian/plugins/` folder.
3. Reload Obsidian and enable **Festa** under Settings, then Community plugins.

After updating by hand, reload Obsidian so the new version is loaded.

## Using it

- **New daily notes** get their feast automatically, whether you create them with the core Daily notes plugin, the Calendar plugin or Periodic Notes. Festa follows your daily notes folder and date format.
- **Notes made ahead of time** get their feast when you open them. By default this applies to today's note only, so browsing old notes changes nothing.
- **Insert feast for this note** adds the feast to the daily note you have open, if it does not have one yet.
- **Insert feast callout here** puts the callout at the cursor in any note. It uses the note's date when the note is a daily note, and today otherwise.
- **Add feasts to all daily notes** fills in every existing daily note that has no feast yet. It asks before editing anything and never adds a feast twice.
- **Refresh feast for this note** and **Refresh feasts in all daily notes** remove what Festa added and add it again with your current settings. Use them after changing the layout, template or language. The rest of each note is left alone.

### The rank line

The second line says what kind of day it is and how it ranks under the 1960 rubrics: for example "First-class feast", "Second-class Sunday", "Second-class Ember day", "First-class vigil", "Third-class feria" or "Second-class day" within an octave. The week is counted from the Sunday that governs it, so in November it follows the Sundays after Epiphany that are resumed at the end of the year.

### Properties

Festa can also write the feast into note properties, so Dataview or Bases can query it: `feast`, `feast_la`, `feast_class`, `feast_color`, `feast_comm`, `feast_season`, `feast_week` and `feast_missal`, which holds the page numbers in the Angelus Press, Baronius and Lasance hand missals. Properties are on by default. Turn off **Insert properties** if you only want the callout.

```dataview
TABLE feast, feast_class AS "Class", feast_color AS "Colour"
FROM "Daily"
WHERE feast_class <= 2
SORT file.name ASC
```

## Settings

| Setting | What it does |
|---|---|
| Title language | English with Latin, Latin only, or English only. |
| Layout | Full puts each detail on its own line. Compact fits the feast on one line. |
| Callout template | The lines of the callout, built from tokens (see below). Changing language or layout replaces the template unless you have edited it. |
| Insert callout | Add the callout at the top of the note. |
| Insert properties | Add the properties listed above. |
| Property prefix | Change `feast`, `feast_la` … to another prefix if `feast` clashes with your own properties. |
| Add automatically | Add the feast when a daily note is created. |
| Add when opening | Add the feast to a daily note without one when you open it: today's note only (default), any daily note, or never. |
| Folder and date format overrides | Only needed if Festa cannot read your daily notes settings. |
| Delay after creation | How long to wait before writing, so template plugins finish first. |

### Template tokens

| Token | Example |
|---|---|
| `{title_en}` | Ember Saturday of September |
| `{title_la}` | Sabbato Quattuor Temporum Septembris |
| `{rank}` | Second-class Ember day |
| `{class}` | II |
| `{colour}` | violet |
| `{week_label}` / `{week_label_la}` | 17th week after Pentecost / Hebdomada XVII post Pentecosten |
| `{season}` / `{season_la}` | Time after Pentecost / Tempus post Pentecosten |
| `{comm_en}` / `{comm_la}` | Sts. Cyprian & Justina / Ss. Cypriani et Justinæ Martyrum |
| `{roman_date}` / `{roman_date_long}` | a.d. VI Kal. Oct. / ante diem sextum Kalendas Octobres |
| `{latin_line}` | The Latin title and the Roman date together |
| `{weekday_la}` | Sabbato |
| `{pages}` | Angelus Press p. 785 · Baronius p. 708 · Lasance p. 699 |
| `{displaced}` | Feasts that give way to this day |
| `{date}` | 2026-09-26 |

A line whose tokens all come out empty is left out, so the commemoration line disappears on days without one. Wrap an optional part in `[? … ?]` to drop just that part, as in `[? · Comm. {comm_en}?]`. The settings tab lists every token.

### With Templater

Festa waits briefly after a note is created and checks again a moment later, so it works alongside Templater's "Trigger on new file creation". If you would rather place the callout from your own template, turn off **Add automatically** and call Festa from the template:

```
<% app.plugins.plugins.festa.api.renderCallout(tp.file.title) %>
```

`api.lookup(date)` returns everything Festa knows about a date, and `api.frontmatterFields(date)` returns the properties.

## Data

The calendar covers **2020 to 2040** and follows the 1962 rubrics for the general Roman calendar. It is generated from [Missale Meum](https://github.com/mmolenda/missalemeum) by Marcin Molenda (MIT licence), pinned to a specific commit that the settings tab shows.

Each bundled year is checked against the live Missale Meum service and against an independent implementation, Joe Antognini's [tridentine_calendar](https://github.com/joe-antognini/tridentine_calendar). The results are logged in `scripts/VERIFIED.md`. Local corrections live in `scripts/overrides.json`:

- St Joseph falling on Friday of Passion Week, in 2027 and 2032, is celebrated as a first-class feast instead of giving way to the weekday.
- Christmas, All Souls and the Saturdays of Our Lady are named for the day rather than for one of their Masses.
- St Jerome's Latin title reads "Presbyteri" rather than "Presbyteris".

National and religious-order calendars are not included yet.

To regenerate the data you need Python 3.13 or newer and [uv](https://docs.astral.sh/uv/):

```bash
git submodule update --init
npm run data:generate          # writes src/data/
npm run data:verify -- 2026    # round-trip, second opinion, awkward-date table
```

## Development

```bash
npm install
npm test           # unit tests
npm run lint
npm run build      # production main.js

# Build straight into a vault while you work
OBSIDIAN_PLUGIN_DIR="/path/to/vault/.obsidian/plugins/festa" npm run dev
```

Pushing a tag builds `main.js` and creates a draft GitHub release with the three plugin files.

## Roadmap

- 1.1: rosary mysteries, weekday and monthly devotions, First Friday and First Saturday, the seasonal Marian antiphon.
- 1.2: fasting and abstinence, with presets for different disciplines, and holy days of obligation by country.
- 2.0: the Collect, Epistle and Gospel, and the Roman Martyrology of the day.
- Later: national and religious-order calendars.

## Licence

MIT. Calendar data derived from Missale Meum, also MIT.
