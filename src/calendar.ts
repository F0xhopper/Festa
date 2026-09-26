import titlesJson from "./data/titles.json";
import meta from "./data/meta.json";
import readingsJson from "./data/readings.json";
import { YEARS } from "./data/index";
import { dayOfYear, parseISO, weekday } from "./dates";
import { romanDate } from "./roman-date";
import { weekInfo, weekdayLa } from "./seasons";
import type { Bilingual, Colour, DayInfo, Observance, Rank, Readings, Titles } from "./types";

const TITLES = titlesJson as Titles;
const READINGS = readingsJson as Readings[];

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

	return {
		date: dateISO,
		year: date.y,
		month: date.m,
		day: date.d,
		weekday: wd,
		celebration: observance(celId, rank, colour),
		commemorations: comms.map(([id, r, c]) => observance(id, r, c)),
		displaced: displaced.map((id) => ({ id, title: title(id) })),
		pages: {
			...(angelus ? { angelus } : {}),
			...(lasance ? { lasance } : {}),
			...(baronius ? { baronius } : {}),
		},
		readings: READINGS[readingsIndex] ?? null,
		ember: flags.includes("E"),
		weekKey,
		...weekInfo(weekKey, date, wd),
		weekdayLa: weekdayLa(wd),
		romanDate: romanDate(date),
	};
}
