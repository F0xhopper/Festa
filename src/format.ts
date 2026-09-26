import { roman } from "./seasons";
import { COLOUR_NAME, type DayInfo } from "./types";

export type TitleLanguage = "both" | "la" | "en";

export interface FormatOptions {
	titleLanguage: TitleLanguage;
	template: string;
	frontmatterPrefix: string;
}

export const DEFAULT_TEMPLATES: Record<TitleLanguage, string> = {
	both: [
		"> [!festa|{colour}] {title_la}",
		"> **{title_en}** · Class {class} · {colour}",
		"> Comm. {comm_both}",
		"> {weekday_la} · {week_label} · {roman_date}",
		"> Missal: {pages}",
	].join("\n"),
	la: [
		"> [!festa|{colour}] {title_la} · Classis {class}",
		"> Comm. {comm_la}",
		"> {weekday_la} · {week_label_la} · {roman_date}",
		"> Missal: {pages}",
	].join("\n"),
	en: [
		"> [!festa|{colour}] {title_en} · Class {class} · {colour}",
		"> Comm. {comm_en}",
		"> {weekday_la} · {week_label} · {roman_date}",
		"> Missal: {pages}",
	].join("\n"),
};

export const TOKENS = [
	"title", "title_alt", "title_la", "title_en", "class", "class_num", "colour", "colour_code",
	"comm", "comm_alt", "comm_la", "comm_en", "comm_both", "displaced", "weekday_la",
	"week_label", "week_label_la", "week", "season", "season_la", "roman_date", "roman_date_long",
	"pages", "date",
] as const;

export function tokens(info: DayInfo, lang: TitleLanguage): Record<string, string> {
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

/**
 * Fill the template. A line that uses at least one token and whose tokens all came out
 * empty is dropped, so "Comm. {comm_both}" disappears on days without a commemoration.
 * Unknown tokens are left as written so a typo is visible.
 */
export function renderCallout(info: DayInfo, opts: Pick<FormatOptions, "titleLanguage" | "template">): string {
	const values = tokens(info, opts.titleLanguage);
	const out: string[] = [];
	for (const line of opts.template.split(/\r?\n/)) {
		let used = 0;
		let filled = 0;
		const rendered = line.replace(/\{([a-z_]+)\}/g, (whole, name: string) => {
			if (!(name in values)) return whole;
			used++;
			const v = values[name] ?? "";
			if (v) filled++;
			return v;
		});
		if (used > 0 && filled === 0) continue;
		out.push(rendered);
	}
	return out.join("\n");
}

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
	return fields;
}
