import titlesJson from "./data/titles.json";
import meta from "./data/meta.json";
import readingsJson from "./data/readings.json";
import matinsJson from "./data/matins.json";
import { YEARS } from "./data/index";
import { dayOfYear, parseISO, weekday } from "./dates";
import { romanDate } from "./roman-date";
import { weekInfo, weekdayLa } from "./seasons";
import type { Bilingual, Colour, DayInfo, MatinsReading, MatinsText, Observance, Rank, Readings, Titles } from "./types";

const TITLES = titlesJson as Titles;
const READINGS = readingsJson as Readings[];
const MATINS = matinsJson as Record<string, MatinsText>;

const UNSAFE_NAME = /[\\/:*?"<>|#^[\]]/g;
let noteNames: Map<string, string> | null = null;

/**
 * File name (without folder or extension) for an observance's Matins note: its English title,
 * with the date code added when two observances share a title ("St. Agnes (01-28)").
 */
export function matinsNoteName(id: string): string {
	if (!noteNames) {
		noteNames = new Map();
		const counts = new Map<string, number>();
		const base = (key: string) => (TITLES[key]?.en ?? key).replace(UNSAFE_NAME, "").replace(/\s+/g, " ").trim();
		for (const key of Object.keys(MATINS)) counts.set(base(key), (counts.get(base(key)) ?? 0) + 1);
		for (const key of Object.keys(MATINS)) {
			const name = base(key);
			noteNames.set(key, (counts.get(name) ?? 0) > 1 ? `${name} (${key.split(":")[1] ?? key})` : name);
		}
	}
	return noteNames.get(id) ?? id.replace(UNSAFE_NAME, "");
}

function matinsFor(celebration: Observance, commemorations: Observance[]): MatinsReading | null {
	const own = MATINS[celebration.id];
	if (own) return { ...own, source: celebration, commemoration: false };
	for (const c of commemorations) {
		const text = MATINS[c.id];
		if (text) return { ...text, source: c, commemoration: true };
	}
	return null;
}

export interface DataRange {
	from: number;
	to: number;
	commit: string;
	generated: string;
}

export function dataRange(): DataRange {
	return {
		from: meta.years[0] ?? 0,
		to: meta.years[1] ?? 0,
		commit: meta.commit.slice(0, 7),
		generated: meta.generated,
	};
}

function title(id: string): Bilingual {
	const t = TITLES[id];
	if (!t) throw new Error(`Festa: missing title for ${id}`);
	return t;
}

function observance(id: string, rank: number, colour: Colour): Observance {
	return { id, title: title(id), rank: rank as Rank, colour };
}

/** Everything Festa knows about one date, or undefined outside the bundled years. */
export function lookup(dateISO: string): DayInfo | undefined {
	const date = parseISO(dateISO);
	if (!date) return undefined;
	const rows = YEARS[date.y];
	if (!rows) return undefined;
	const row = rows[dayOfYear(date)];
	if (!row || row[0] !== dateISO) throw new Error(`Festa: data out of order at ${dateISO}`);

	const [, celId, rank, colour, comms, displaced, pages, weekKey, readingsIndex, flags] = row;
	const wd = weekday(date);
	const [angelus, lasance, baronius] = pages;

	const celebration = observance(celId, rank, colour);
	const commemorations = comms.map(([id, r, c]) => observance(id, r, c));

	return {
		date: dateISO,
		year: date.y,
		month: date.m,
		day: date.d,
		weekday: wd,
		celebration,
		commemorations,
		displaced: displaced.map((id) => ({ id, title: title(id) })),
		pages: {
			...(angelus ? { angelus } : {}),
			...(lasance ? { lasance } : {}),
			...(baronius ? { baronius } : {}),
		},
		readings: READINGS[readingsIndex] ?? null,
		matins: matinsFor(celebration, commemorations),
		ember: flags.includes("E"),
		weekKey,
		...weekInfo(weekKey, date, wd),
		weekdayLa: weekdayLa(wd),
		romanDate: romanDate(date),
	};
}
