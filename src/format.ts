import { rankLabel } from "./describe";
import { fasting, type FastingDiscipline } from "./fasting";
import { roman } from "./seasons";
import { COLOUR_NAME, type DayInfo, type ReadingRefs } from "./types";

export type TitleLanguage = "both" | "la" | "en";
export type Layout = "full" | "compact";


export interface FormatOptions {
	titleLanguage: TitleLanguage;
	fasting?: FastingDiscipline;
	layout: Layout;
	template: string;
	frontmatterPrefix: string;
}

/** Which optional lines the generated template includes. The title line is always shown. */
export interface ShowOptions {
	/** Rank and week, e.g. "Third-class feast · 18th week after Pentecost". */
	rank: boolean;
	commemorations: boolean;
	readings: boolean;
	/** The Latin title and the Roman-style date. */
	latin: boolean;
}

export const DEFAULT_SHOW: ShowOptions = { rank: true, commemorations: true, readings: true, latin: true };

/**
 * Template syntax: {token} is replaced by its value. [? … ?] is an optional segment,
 * dropped when every token inside it is empty. A line that uses tokens and whose tokens
 * all came out empty is dropped. Fasting has its own setting and vanishes when it is off,
 * so it is always in the generated template.
 */
export function defaultTemplate(layout: Layout, lang: TitleLanguage, show: ShowOptions = DEFAULT_SHOW): string {
	const la = lang === "la";
	const fasting = la ? "{fasting_la}" : "{fasting}";
	const comm = la ? "{comm_la}" : "{comm_en}";
	if (layout === "compact") {
		const title = la ? "{title_la}" : "{title_en}";
		const rank = show.rank ? (la ? " · Classis {class}" : " · {rank}") : "";
		const comms = show.commemorations ? `[? · Comm. ${comm}?]` : "";
		return `> [!festa|{colour}] ${title}${rank}${comms}[? · **${fasting}**?]`;
	}
	const lines = [la ? "> [!festa|{colour}] {title_la}" : "> [!festa|{colour}] {title_en}"];
	if (show.rank) {
		const date = show.latin && lang !== "both" ? " · {roman_date}" : "";
		lines.push(la ? `> Classis {class} · {week_label_la}${date}` : `> {rank} · {week_label}${date}`);
	} else if (show.latin && lang !== "both") {
		lines.push("> {roman_date}");
	}
	if (show.commemorations) lines.push(la ? "> Commemoratio: {comm_la}" : "> Commemoration: {comm_en}");
	lines.push(`> **${fasting}**`);
	if (show.readings) lines.push(la ? "> {readings_la}" : "> {readings}");
	if (show.latin && lang === "both") lines.push("> *{latin_line}*");
	return lines.join("\n");
}

/** The template in use: the custom one if the user wrote one, otherwise the generated default. */
export function effectiveTemplate(s: { template: string; layout: Layout; titleLanguage: TitleLanguage; show?: ShowOptions }): string {
	return s.template.trim() ? s.template : defaultTemplate(s.layout, s.titleLanguage, s.show ?? DEFAULT_SHOW);
}

/** Templates shipped in earlier versions, so saved copies can be upgraded to the new defaults. */
export const LEGACY_TEMPLATES: string[] = [
	[
		"> [!festa|{colour}] {title_en}",
		"> {rank} · {week_label}",
		"> Commemoration: {comm_en}",
		"> **{fasting}**",
		"> {readings}",
		"> *{latin_line}*",
		"> {matins}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_la}",
		"> Classis {class} · {week_label_la} · {roman_date}",
		"> Commemoratio: {comm_la}",
		"> **{fasting_la}**",
		"> {readings_la}",
		"> {matins}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_en}",
		"> {rank} · {week_label} · {roman_date}",
		"> Commemoration: {comm_en}",
		"> **{fasting}**",
		"> {readings}",
		"> {matins}",
	].join("\n"),
	"> [!festa|{colour}] {title_en} · {rank}[? · Comm. {comm_en}?][? · **{fasting}**?]",
	"> [!festa|{colour}] {title_la} · Classis {class}[? · Comm. {comm_la}?][? · **{fasting_la}**?]",
	"> [!festa|{colour}] {title_en} · {rank}[? · Comm. {comm_en}?][? · **{fasting}**?]",
	[
		"> [!festa|{colour}] {title_en}",
		"> {rank} · {week_label}",
		"> Commemoration: {comm_en}",
		"> **{fasting}**",
		"> {readings}",
		"> *{latin_line}*",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_la}",
		"> Classis {class} · {week_label_la} · {roman_date}",
		"> Commemoratio: {comm_la}",
		"> **{fasting_la}**",
		"> {readings_la}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_en}",
		"> {rank} · {week_label} · {roman_date}",
		"> Commemoration: {comm_en}",
		"> **{fasting}**",
		"> {readings}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_en}",
		"> {rank} · {week_label}",
		"> Commemoration: {comm_en}",
		"> *{latin_line}*",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_en}",
		"> {rank} · {week_label} · {roman_date}",
		"> Commemoration: {comm_en}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_la}",
		"> Classis {class} · {week_label_la} · {roman_date}",
		"> Commemoratio: {comm_la}",
	].join("\n"),
	"> [!festa|{colour}] {title_en} · {rank}[? · Comm. {comm_en}?]",
	"> [!festa|{colour}] {title_la} · Classis {class}[? · Comm. {comm_la}?]",
	[
		"> [!festa|{colour}] {title_en}",
		"> *{title_la_sub}*",
		">",
		"> {class} class · {week_label} · {roman_date}",
		"> Commemoration: {comm_en}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_en}",
		"> {class} class · {week_label} · {roman_date}",
		"> Commemoration: {comm_en}",
	].join("\n"),
	"> [!festa|{colour}] {title_en} · {class} class[? · Comm. {comm_en}?]",
	[
		"> [!festa|{colour}] {title_la}",
		"> **{title_en}** · Class {class} · {colour}",
		"> Comm. {comm_both}",
		"> {weekday_la} · {week_label} · {roman_date}",
		"> Missal: {pages}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_la} · Classis {class}",
		"> Comm. {comm_la}",
		"> {weekday_la} · {week_label_la} · {roman_date}",
		"> Missal: {pages}",
	].join("\n"),
	[
		"> [!festa|{colour}] {title_en} · Class {class} · {colour}",
		"> Comm. {comm_en}",
		"> {weekday_la} · {week_label} · {roman_date}",
		"> Missal: {pages}",
	].join("\n"),
];

export function isDefaultTemplate(template: string): boolean {
	return template.trim() === "" || LEGACY_TEMPLATES.includes(template);
}

export const TOKENS = [
	"title", "title_alt", "title_la", "title_en", "title_la_sub", "latin_line", "rank", "fasting", "fasting_la", "readings", "readings_la", "epistle", "gospel", "lessons", "epistle_la", "gospel_la", "lessons_la", "class", "class_num", "colour", "colour_code",
	"comm", "comm_alt", "comm_la", "comm_en", "comm_both", "displaced", "weekday_la",
	"week_label", "week_label_la", "week", "season", "season_la", "roman_date", "roman_date_long",
	"pages", "date",
] as const;

function readingsLine(r: ReadingRefs | undefined, la: boolean): string {
	if (!r) return "";
	const parts: string[] = [];
	if (r.e) parts.push(`${la ? "Epistola" : "Epistle"}: ${r.e}`);
	else if (r.l.length) parts.push(`${la ? "Lectiones" : "Lessons"}: ${r.l.join("; ")}`);
	if (r.g) parts.push(`${la ? "Evangelium" : "Gospel"}: ${r.g}`);
	return parts.join(" · ");
}

export function tokens(
	info: DayInfo,
	lang: TitleLanguage,
	discipline: FastingDiscipline = "traditional",
): Record<string, string> {
	const fast = fasting(info, discipline);
	const en = info.readings?.en;
	const la = info.readings?.la;
	const primary = lang === "en" ? "en" : "la";
	const secondary = lang === "both" ? "en" : null;
	const comms = info.commemorations;
	const join = (xs: string[]) => xs.join("; ");
	const pages = [
		info.pages.angelus ? `Angelus Press p. ${info.pages.angelus}` : "",
		info.pages.baronius ? `Baronius p. ${info.pages.baronius}` : "",
		info.pages.lasance ? `Lasance p. ${info.pages.lasance}` : "",
	].filter(Boolean);

	return {
		title: info.celebration.title[primary],
		title_alt: secondary ? info.celebration.title[secondary] : "",
		title_la: info.celebration.title.la,
		title_en: info.celebration.title.en,
		title_la_sub: info.celebration.title.la === info.celebration.title.en ? "" : info.celebration.title.la,
		latin_line: [
			info.celebration.title.la === info.celebration.title.en ? "" : info.celebration.title.la,
			info.romanDate.short,
		]
			.filter(Boolean)
			.join(" · "),
		rank: rankLabel(info.celebration, info.weekday),
		fasting: fast.en,
		fasting_la: fast.la,
		readings: readingsLine(en, false),
		readings_la: readingsLine(la, true),
		epistle: en?.e ?? "",
		gospel: en?.g ?? "",
		lessons: en?.l.join("; ") ?? "",
		epistle_la: la?.e ?? "",
		gospel_la: la?.g ?? "",
		lessons_la: la?.l.join("; ") ?? "",
		class: roman(info.celebration.rank),
		class_num: String(info.celebration.rank),
		colour: COLOUR_NAME[info.celebration.colour],
		colour_code: info.celebration.colour,
		comm: join(comms.map((c) => c.title[primary])),
		comm_alt: secondary ? join(comms.map((c) => c.title[secondary])) : "",
		comm_la: join(comms.map((c) => c.title.la)),
		comm_en: join(comms.map((c) => c.title.en)),
		comm_both: join(comms.map((c) => (c.title.la === c.title.en ? c.title.la : `${c.title.la} (${c.title.en})`))),
		displaced: join(info.displaced.map((d) => d.title[primary])),
		weekday_la: info.weekdayLa,
		week_label: info.weekLabel.en,
		week_label_la: info.weekLabel.la,
		week: info.week === null ? "" : String(info.week),
		season: info.seasonName.en,
		season_la: info.seasonName.la,
		roman_date: info.romanDate.short,
		roman_date_long: info.romanDate.long,
		pages: pages.join(" · "),
		date: info.date,
	};
}

function fill(text: string, values: Record<string, string>): { text: string; used: number; filled: number } {
	let used = 0;
	let filled = 0;
	const out = text.replace(/\{([a-z_]+)\}/g, (whole, name: string) => {
		if (!(name in values)) return whole;
		used++;
		const v = values[name] ?? "";
		if (v) filled++;
		return v;
	});
	return { text: out, used, filled };
}

/**
 * Fill the template. Optional segments [? … ?] vanish when all their tokens are empty.
 * A line that uses at least one token and whose tokens all came out empty is dropped,
 * so "Commemoration: {comm_en}" disappears on days without a commemoration.
 * Unknown tokens are left as written so a typo is visible.
 */
export function renderCallout(
	info: DayInfo,
	opts: Pick<FormatOptions, "titleLanguage" | "template" | "fasting">,
): string {
	const values = tokens(info, opts.titleLanguage, opts.fasting);
	const out: string[] = [];
	for (const line of opts.template.split(/\r?\n/)) {
		let used = 0;
		let filled = 0;
		const withGroups = line.replace(/\[\?([\s\S]*?)\?\]/g, (_whole, inner: string) => {
			const r = fill(inner, values);
			used += r.used;
			filled += r.filled;
			return r.used > 0 && r.filled === 0 ? "" : r.text;
		});
		const r = fill(withGroups, values);
		used += r.used;
		filled += r.filled;
		if (used > 0 && filled === 0) continue;
		out.push(r.text);
	}
	return out.join("\n");
}

/** Every property suffix Festa may write, so a refresh can remove them all. */
export const FIELD_SUFFIXES = ["", "_la", "_class", "_color", "_comm", "_season", "_week", "_missal"];

export function frontmatterFields(info: DayInfo, prefix: string): Record<string, string | number | string[]> {
	const fields: Record<string, string | number | string[]> = {
		[prefix]: info.celebration.title.en,
		[`${prefix}_la`]: info.celebration.title.la,
		[`${prefix}_class`]: info.celebration.rank,
		[`${prefix}_color`]: COLOUR_NAME[info.celebration.colour],
	};
	if (info.commemorations.length) fields[`${prefix}_comm`] = info.commemorations.map((c) => c.title.en);
	fields[`${prefix}_season`] = info.seasonName.en;
	if (info.week !== null) fields[`${prefix}_week`] = info.week;
	const pages = tokens(info, "en").pages;
	if (pages) fields[`${prefix}_missal`] = pages;
	return fields;
}
