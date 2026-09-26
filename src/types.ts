export type Colour = "w" | "r" | "v" | "g" | "b" | "p";

export const COLOUR_NAME: Record<Colour, string> = {
	w: "white",
	r: "red",
	v: "violet",
	g: "green",
	b: "black",
	p: "rose",
};

export type Season =
	| "advent"
	| "christmas"
	| "epiphany"
	| "septuagesima"
	| "lent"
	| "passiontide"
	| "paschaltide"
	| "pentecost";

export interface Bilingual {
	en: string;
	la: string;
}

export type Titles = Record<string, Bilingual>;

/** [date, celebrationId, rank, colour, commemorations, displaced, pages, weekKey, readingsIndex, flags] */
export type YearRow = [
	string,
	string,
	number,
	Colour,
	[string, number, Colour][],
	string[],
	[number, number, number],
	string,
	number,
	string,
];

/** Scripture references for one language: epistle, gospel, and extra lessons (Ember days, Good Friday). */
export interface ReadingRefs {
	e: string;
	g: string;
	l: string[];
}

export type Readings = Record<"en" | "la", ReadingRefs>;

export type Rank = 1 | 2 | 3 | 4;

export interface Observance {
	id: string;
	title: Bilingual;
	rank: Rank;
	colour: Colour;
}

export interface MissalPages {
	angelus?: number;
	lasance?: number;
	baronius?: number;
}

export interface WeekInfo {
	season: Season;
	seasonName: Bilingual;
	week: number | null;
	weekLabel: Bilingual;
}

export interface DayInfo extends WeekInfo {
	date: string;
	year: number;
	month: number;
	day: number;
	/** 0 = Sunday … 6 = Saturday */
	weekday: number;
	celebration: Observance;
	commemorations: Observance[];
	displaced: { id: string; title: Bilingual }[];
	pages: MissalPages;
	readings: Readings | null;
	/** An Ember day, even when a feast outranks it. */
	ember: boolean;
	/** The key of the Sunday that governs the week ("Pent17", "Quad6" …). */
	weekKey: string;
	weekdayLa: string;
	romanDate: { short: string; long: string };
}
