# Festa

Festa adds the traditional Roman calendar to your Obsidian daily notes. Each new daily note gets the feast of the day according to the 1962 Missal: its Latin and English title, class, liturgical colour, commemorations, the week of the liturgical year, the Roman-style date, and the page in the common hand missals.

Everything is bundled with the plugin, so it works offline and never contacts a server.

```markdown
> [!festa|violet] Ember Saturday of September
> *Sabbato Quattuor Temporum Septembris*
>
> II class · 17th week after Pentecost · a.d. VI Kal. Oct.
> Commemoration: Sts. Cyprian & Justina
```

Or, with the compact layout:

```markdown
> [!festa|violet] Ember Saturday of September · II class · Comm. Sts. Cyprian & Justina
```

Festa can also add the feast as note properties (`feast`, `feast_la`, `feast_class`, `feast_color`, `feast_comm`, `feast_season`, `feast_week`, `feast_missal`) for Dataview or Bases. Turn them off in the settings if you only want the callout.

The callout is tinted with the colour of the day: violet, green, red, white, black or rose.

## Using it

- **New daily notes** get their feast automatically, whether you create them with the core Daily notes plugin, the Calendar plugin or Periodic Notes. Festa follows your daily notes folder and date format.
- **Insert feast for this note** adds the feast to the daily note you have open, if it does not have one yet.
- **Insert feast callout here** puts the callout at the cursor in any note. It uses the note's date when the note is a daily note, and today otherwise.
- **Add feasts to all daily notes** fills in every existing daily note that has no feast yet. It asks before editing anything and never touches a note twice.
- **Refresh feast for this note** and **Refresh feasts in all daily notes** remove what Festa added and add it again with your current settings. Use them after changing the layout, template or language. They leave the rest of each note alone.

The properties let you query the calendar with Dataview or Bases, for example:

```dataview
TABLE feast, feast_class AS "Class", feast_color AS "Colour"
FROM "Daily"
WHERE feast_class <= 2
SORT file.name ASC
```

## Settings

| Setting | What it does |
|---|---|
| Title language | Latin and English, Latin only, or English only. |
| Layout | Full puts each detail on its own line. Compact fits the feast on one line. |
| Callout template | The lines of the callout, with tokens such as `{title_en}`, `{title_la_sub}`, `{class}`, `{comm_en}`, `{week_label}`, `{roman_date}` and `{pages}`. A line whose tokens are all empty is left out, so the commemoration line disappears on days without one. Wrap an optional part in `[? … ?]` to drop just that part, as in `[? · Comm. {comm_en}?]`. |
| Insert callout / Insert properties | Turn either part off. |
| Property prefix | Change `feast`, `feast_la` … to another prefix if `feast` clashes with your own properties. |
| Add automatically | Turn off to add feasts only through the commands. |
| Folder and date format overrides | Only needed if Festa cannot read your daily notes settings. |
| Delay after creation | How long to wait before writing, so template plugins finish first. |

### With Templater

Festa waits briefly after a note is created and checks again a moment later, so it works alongside Templater's "Trigger on new file creation". If you prefer to control placement from your template, turn off **Add automatically** and call the plugin from the template instead:

```
<% app.plugins.plugins.festa.api.renderCallout(tp.file.title) %>
```

`api.lookup(date)` returns everything Festa knows about a date as an object, and `api.frontmatterFields(date)` returns the properties.

## Data

The calendar covers **2020 to 2040** and follows the 1962 rubrics for the general Roman calendar. It is generated from [Missale Meum](https://github.com/mmolenda/missalemeum) by Marcin Molenda (MIT licence), pinned to a specific commit shown in the plugin settings.

Each bundled year is checked against the live Missale Meum service and against an independent implementation, Joe Antognini's [tridentine_calendar](https://github.com/joe-antognini/tridentine_calendar). Local corrections live in `scripts/overrides.json` and the verification log in `scripts/VERIFIED.md`. Currently one upstream issue is corrected: St Joseph falling on Friday of Passion Week (2027 and 2032).

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

## Roadmap

- 1.1: rosary mysteries, weekday and monthly devotions, First Friday and First Saturday, the seasonal Marian antiphon.
- 1.2: fasting and abstinence, with presets for different disciplines, and holy days of obligation by country.
- 2.0: the Collect, Epistle and Gospel, and the Roman Martyrology of the day.
- Later: national and religious-order calendars.

## Licence

MIT. Calendar data derived from Missale Meum, also MIT.
