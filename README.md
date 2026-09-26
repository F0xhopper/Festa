# Festa

Festa adds the traditional Roman calendar to your Obsidian daily notes. Each daily note gets the feast of the day according to the 1962 Missal: its English and Latin title, its rank, commemorations, fast and abstinence, the Epistle and Gospel of the day's Mass, the week of the liturgical year and the Roman-style date, in a callout tinted with the liturgical colour of the day. You choose which lines appear. Optionally, a last line links to the Matins reading from the Breviary about the saint or feast.

Everything is bundled with the plugin. It works offline, on desktop and mobile, and never contacts a server.

```markdown
> [!festa|violet] Ember Saturday of September
> Second-class Ember day · 17th week after Pentecost
> Commemoration: Sts. Cyprian & Justina
> **Fast and abstinence**
> Epistle: Heb 9:2–12 · Gospel: Luke 13:6–17
> *Sabbato Quattuor Temporum Septembris · a.d. VI Kal. Oct.*
```

```markdown
> [!festa|white] St. Jerome
> Third-class feast · 18th week after Pentecost
> Epistle: 2 Tim 4:1–8 · Gospel: Matt 5:13–19
> *S. Hieronymi Presbyteri Confessoris et Ecclesiæ Doctoris · prid. Kal. Oct.*
```

The callout is violet, green, red, white, black or rose, following the colour of the day. A compact one-line layout is also available:

```markdown
> [!festa|violet] Ember Saturday of September · Second-class Ember day · Comm. Sts. Cyprian & Justina · **Fast and abstinence**
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

### Fast and abstinence

A bold line marks the days of fasting and abstinence. Choose the rules in the settings:

- **1962 discipline** (default) follows the 1917 Code that governed the 1962 Missal. Abstinence on Fridays. Fast and abstinence on Ash Wednesday, the Fridays and Saturdays of Lent, the Ember days, and the vigils of Pentecost, the Assumption, All Saints and Christmas. Fast alone on the other weekdays of Lent. Nothing on Sundays, or on holy days of obligation outside Lent. The Holy Saturday fast ends at noon. Some countries had indults that relaxed parts of this, such as partial abstinence on Ember Wednesdays and Saturdays in the United States; Festa shows the universal law.
- **Current law** follows the 1983 Code: fast and abstinence on Ash Wednesday and Good Friday, abstinence on the Fridays of Lent, and abstinence or another penance on other Fridays unless a solemnity falls on them. Bishops' conferences may adapt these.
- **Don't show** hides the line.

### Readings

The readings line gives the references for the Epistle and Gospel of the day's Mass, in English, or in Latin with the Latin template. On Good Friday it lists the two lessons and the Passion. The Old Testament lessons of Ember Wednesdays and Saturdays are in the `{lessons}` token, if you want them in your template.

### Matins reading (optional)

Off by default. Turn on **Matins reading** in the settings and the last line links to the day's reading from Matins, the night office of the Breviary: the Church's own short life of the saint, or a Father's sermon on the feast. Click it and the reading opens in a window, in Latin and English, straight from the text bundled with Festa. Nothing is written to your vault. The window has a **Save as note** button if you want to keep a reading; it goes in `Festa/Matins`. The command **Open the reading of the day** does the same for the daily note you have open.

The reading follows the 1960 rubrics: first- and second-class feasts give the three lessons of the second nocturn, and third-class feasts and commemorated saints give the single shortened historical lesson. On a day without a feast of its own, such as an Ember day, the link goes to the commemorated saint's reading and names them.

Choose Latin and English, Latin, or English in the settings. Days whose lessons would come from the Common, such as ordinary weekdays and most minor commemorations, have no reading.

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
| Show rank and week | "Third-class feast · 18th week after Pentecost". |
| Show commemorations | The saints commemorated on the day. |
| Show the readings | The Epistle and Gospel references. |
| Show the Latin title and Roman date | The italic Latin line. |
| Fasting and abstinence | 1962 discipline, current law, or don't show. |
| Matins reading | Off by default. Latin and English, Latin, or English. |
| Custom template | Empty by default, which means the lines follow the options above. Write your own template here for full control. |
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
| `{fasting}` / `{fasting_la}` | Fast and abstinence / Jejunium et abstinentia |
| `{readings}` / `{readings_la}` | Epistle: Heb 9:2–12 · Gospel: Luke 13:6–17 / Epistola: Hebr 9:2–12 · Evangelium: Luc 13:6–17 |
| `{epistle}`, `{gospel}`, `{lessons}` | Each reference on its own, with `_la` versions |
| `{matins}` | The link to the Matins reading: `[Matins reading](obsidian://festa?matins=2026-09-30)` |
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

The calendar covers **2020 to 2040** and follows the 1962 rubrics for the general Roman calendar. The reading references and the Matins lessons come from the Mass and Breviary texts of the [Divinum Officium](https://github.com/DivinumOfficium/divinum-officium) project (MIT licence), which Missale Meum builds on. `scripts/matins.py` resolves the Breviary files for the 1960 rubrics. It is generated from [Missale Meum](https://github.com/mmolenda/missalemeum) by Marcin Molenda (MIT licence), pinned to a specific commit that the settings tab shows.

Each bundled year is checked against the live Missale Meum service and against an independent implementation, Joe Antognini's [tridentine_calendar](https://github.com/joe-antognini/tridentine_calendar). The results are logged in `scripts/VERIFIED.md`. Local corrections live in `scripts/overrides.json`:

- St Joseph falling on Friday of Passion Week, in 2027 and 2032, is celebrated as a first-class feast instead of giving way to the weekday.
- Christmas, All Souls and the Saturdays of Our Lady are named for the day rather than for one of their Masses.
- St Jerome's Latin title reads "Presbyteri" rather than "Presbyteris".

National and religious-order calendars are not included yet.

To regenerate the data you need Python 3.13 or newer and [uv](https://docs.astral.sh/uv/):

```bash
git submodule update --init --recursive --depth 1
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

- Rosary mysteries, weekday and monthly devotions, First Friday and First Saturday, the seasonal Marian antiphon.
- Holy days of obligation by country.
- The Collect and the Roman Martyrology of the day.
- Matins readings for Sundays and ferias (the patristic homilies and occurring Scripture).
- Later: national and religious-order calendars.

## Licence

MIT. Calendar data derived from Missale Meum and Divinum Officium, both MIT.
