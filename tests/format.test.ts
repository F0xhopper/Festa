import { describe, expect, it } from "vitest";
import { lookup } from "../src/calendar";
import { matinsNoteName } from "../src/calendar";
import {
	DEFAULT_SHOW,
	defaultTemplate,
	effectiveTemplate,
	frontmatterFields,
	isDefaultTemplate,
	LEGACY_TEMPLATES,
	matinsNoteContent,
	matinsNotePath,
	renderCallout,
} from "../src/format";

const today = () => lookup("2026-09-26")!;

describe("renderCallout, full layout", () => {
	it("renders today's note as designed", () => {
		expect(renderCallout(today(), { titleLanguage: "both", template: defaultTemplate("full", "both"), matins: "off" })).toBe(
			[
				"> [!festa|violet] Ember Saturday of September",
				"> Second-class Ember day · 17th week after Pentecost",
				"> Commemoration: Sts. Cyprian & Justina",
				"> **Fast and abstinence**",
				"> Epistle: Heb 9:2–12 · Gospel: Luke 13:6–17",
				"> *Sabbato Quattuor Temporum Septembris · a.d. VI Kal. Oct.*",
			].join("\n"),
		);
	});

	it("drops the commemoration line when there is none", () => {
		const out = renderCallout(lookup("2026-12-25")!, { titleLanguage: "both", template: defaultTemplate("full", "both"), matins: "off" });
		expect(out).toBe(
			[
				"> [!festa|white] The Nativity of Our Lord",
				"> First-class feast · Octave of Christmas",
				"> Epistle: Titus 2:11–15 · Gospel: Luke 2:1–14",
				"> *In Nativitate Domini · a.d. VIII Kal. Ian.*",
			].join("\n"),
		);
	});

	it("renders St Jerome with the corrected Latin", () => {
		expect(renderCallout(lookup("2026-09-30")!, { titleLanguage: "both", template: defaultTemplate("full", "both"), matins: "off" })).toBe(
			[
				"> [!festa|white] St. Jerome",
				"> Third-class feast · 18th week after Pentecost",
				"> Epistle: 2 Tim 4:1–8 · Gospel: Matt 5:13–19",
				"> *S. Hieronymi Presbyteri Confessoris et Ecclesiæ Doctoris · prid. Kal. Oct.*",
			].join("\n"),
		);
	});

	it("renders the Latin and English templates", () => {
		expect(renderCallout(today(), { titleLanguage: "la", template: defaultTemplate("full", "la"), matins: "off" })).toBe(
			[
				"> [!festa|violet] Sabbato Quattuor Temporum Septembris",
				"> Classis II · Hebdomada XVII post Pentecosten · a.d. VI Kal. Oct.",
				"> Commemoratio: Ss. Cypriani et Justinæ Martyrum",
				"> **Jejunium et abstinentia**",
				"> Epistola: Hebr 9:2–12 · Evangelium: Luc 13:6–17",
			].join("\n"),
		);
		expect(renderCallout(today(), { titleLanguage: "en", template: defaultTemplate("full", "en"), matins: "off" }).split("\n")[0]).toBe(
			"> [!festa|violet] Ember Saturday of September",
		);
	});
});

describe("renderCallout, compact layout and optional segments", () => {
	it("fits on one line", () => {
		expect(renderCallout(today(), { titleLanguage: "both", template: defaultTemplate("compact", "both") })).toBe(
			"> [!festa|violet] Ember Saturday of September · Second-class Ember day · Comm. Sts. Cyprian & Justina · **Fast and abstinence**",
		);
		expect(renderCallout(lookup("2026-12-25")!, { titleLanguage: "both", template: defaultTemplate("compact", "both") })).toBe(
			"> [!festa|white] The Nativity of Our Lord · First-class feast",
		);
	});

	it("keeps unknown tokens and plain lines", () => {
		expect(renderCallout(today(), { titleLanguage: "en", template: "Plain line\n{title} {nope}" })).toBe(
			"Plain line\nEmber Saturday of September {nope}",
		);
	});
});

describe("readings", () => {
	it("shows the lessons and the Passion on Good Friday", () => {
		const out = renderCallout(lookup("2026-04-03")!, { titleLanguage: "en", template: "{readings}" });
		expect(out).toBe("Lessons: Osee 6:1–6; Exod 12:1–11 · Gospel: John 18:1–40; 19:1–42");
	});

	it("keeps the Ember Saturday prophecies in their own token", () => {
		const out = renderCallout(lookup("2026-09-26")!, { titleLanguage: "en", template: "{lessons}" });
		expect(out).toBe("Lev 23:26–32; Lev 23:39–43; Mich 7:14, 16, 18–20; Zach 8:14–19; Dan 3:49–51");
	});

	it("hides the fasting line when fasting is off", () => {
		const out = renderCallout(lookup("2026-09-26")!, {
			titleLanguage: "both",
			fasting: "off",
			template: defaultTemplate("full", "both"),
		});
		expect(out).not.toContain("Fast");
	});
});

describe("Matins reading", () => {
	const lastLine = (
		iso: string,
		titleLanguage: "both" | "la" | "en" = "both",
		matins: "both" | "la" | "en" | "off" = "both",
		matinsMode: "popup" | "note" = "note",
	) => {
		const lines = renderCallout(lookup(iso)!, { titleLanguage, matins, matinsMode, template: defaultTemplate("full", titleLanguage) }).split("\n");
		return lines[lines.length - 1];
	};

	it("links in-app by default, opening the reading without a file", () => {
		const out = renderCallout(lookup("2026-09-30")!, { titleLanguage: "both", matins: "both", template: defaultTemplate("full", "both") }).split("\n");
		expect(out[out.length - 1]).toBe("> [Matins reading](obsidian://festa?matins=2026-09-30)");
		expect(lastLine("2026-09-26", "both", "both", "popup")).toBe("> [Matins reading · Sts. Cyprian & Justina](obsidian://festa?matins=2026-09-26)");
	});

	it("ends the callout with a link to the reading's note in note mode", () => {
		expect(lastLine("2026-09-30")).toBe("> [[Festa/Matins/St. Jerome|Matins reading]]");
		expect(matinsNotePath(lookup("2026-09-30")!, "Liturgy/Readings/")).toBe("Liturgy/Readings/St. Jerome.md");
	});

	it("names the commemorated saint when the reading is theirs", () => {
		expect(lastLine("2026-09-26")).toBe("> [[Festa/Matins/Sts. Cyprian & Justina|Matins reading · Sts. Cyprian & Justina]]");
		expect(lastLine("2026-09-26", "la")).toBe("> [[Festa/Matins/Sts. Cyprian & Justina|Lectio ad Matutinum · Ss. Cypriani et Justinæ Martyrum]]");
	});

	it("keeps note names unique when two feasts share a title", () => {
		expect(matinsNoteName("sancti:12-26c:4:w")).toBe("For Octave of the Nativity (12-26c)");
		expect(matinsNoteName("sancti:12-27c:4:w")).toBe("For Octave of the Nativity (12-27c)");
		expect(matinsNoteName("sancti:09-30:3:w")).toBe("St. Jerome");
	});

	it("has no link when off or when there is no reading", () => {
		expect(lastLine("2026-09-30", "both", "off")).not.toContain("Matins");
		const day = lookup("2026-10-06")!;
		if (!day.matins) expect(lastLine("2026-10-06")).not.toContain("Matins");
	});

	it("writes the note in Latin and English, with the sermon's source in italics", () => {
		const note = matinsNoteContent(lookup("2026-09-29")!, "both");
		expect(note.startsWith("# Dedication of St. Michael the Archangel\n\n*In Dedicatione S. Michælis Archangelis*\n\n## Lectio\n\n*Sermo sancti Gregórii Papæ*\n\n")).toBe(true);
		expect(note).toContain("## Reading\n\n*From the Sermons of Pope St. Gregory the Great*");
		expect(note).toContain("Divinum Officium");
		expect(matinsNoteContent(lookup("2026-09-29")!, "la")).not.toContain("## Reading");
		expect(matinsNoteContent(lookup("2026-09-29")!, "en")).not.toContain("## Lectio");
		expect(matinsNoteContent(lookup("2026-09-29")!, "off")).toBe("");
	});
});

describe("show options", () => {
	const render = (show: Partial<import("../src/format").ShowOptions>, lang: "both" | "la" | "en" = "both", layout: "full" | "compact" = "full") =>
		renderCallout(lookup("2026-09-26")!, {
			titleLanguage: lang,
			template: defaultTemplate(layout, lang, { rank: true, commemorations: true, readings: true, latin: true, ...show }),
		});

	it("leaves the reading off by default", () => {
		expect(renderCallout(lookup("2026-09-30")!, { titleLanguage: "both", template: defaultTemplate("full", "both") })).not.toContain("Matins");
	});

	it("drops each line when its option is off", () => {
		expect(render({ rank: false })).not.toContain("Second-class Ember day");
		expect(render({ commemorations: false })).not.toContain("Commemoration");
		expect(render({ readings: false })).not.toContain("Epistle");
		expect(render({ latin: false })).not.toContain("Sabbato");
		expect(render({ rank: false, commemorations: false, readings: false, latin: false })).toBe(
			"> [!festa|violet] Ember Saturday of September\n> **Fast and abstinence**",
		);
	});

	it("keeps the Roman date on its own line in English when rank is off", () => {
		expect(render({ rank: false }, "en").split("\n")[1]).toBe("> a.d. VI Kal. Oct.");
		expect(render({ latin: false }, "en").split("\n")[1]).toBe("> Second-class Ember day · 17th week after Pentecost");
	});

	it("applies to the compact layout", () => {
		expect(render({ rank: false, commemorations: false }, "both", "compact")).toBe(
			"> [!festa|violet] Ember Saturday of September · **Fast and abstinence**",
		);
	});

	it("uses a custom template only when one is written", () => {
		const base = { layout: "full" as const, titleLanguage: "both" as const, show: { ...DEFAULT_SHOW, readings: false } };
		expect(effectiveTemplate({ ...base, template: "" })).toBe(defaultTemplate("full", "both", base.show));
		expect(effectiveTemplate({ ...base, template: "  " })).toBe(defaultTemplate("full", "both", base.show));
		expect(effectiveTemplate({ ...base, template: "> [!festa] {title}" })).toBe("> [!festa] {title}");
	});
});

describe("templates", () => {
	it("recognises shipped and legacy defaults", () => {
		expect(isDefaultTemplate("")).toBe(true);
		expect(isDefaultTemplate(LEGACY_TEMPLATES[0]!)).toBe(true);
		expect(isDefaultTemplate("> [!festa] {title}")).toBe(false);
	});
});

describe("frontmatterFields", () => {
	it("uses the prefix, includes missal pages and omits empty fields", () => {
		expect(frontmatterFields(today(), "feast")).toEqual({
			feast: "Ember Saturday of September",
			feast_la: "Sabbato Quattuor Temporum Septembris",
			feast_class: 2,
			feast_color: "violet",
			feast_comm: ["Sts. Cyprian & Justina"],
			feast_season: "Time after Pentecost",
			feast_week: 17,
			feast_missal: "Angelus Press p. 785 · Baronius p. 708 · Lasance p. 699",
		});
		const xmas = frontmatterFields(lookup("2026-12-25")!, "festa");
		expect(xmas).not.toHaveProperty("festa_comm");
		expect(xmas).not.toHaveProperty("festa_week");
		expect(xmas.festa_color).toBe("white");
	});
});
