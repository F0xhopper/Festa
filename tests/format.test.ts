import { describe, expect, it } from "vitest";
import { lookup } from "../src/calendar";
import { defaultTemplate, frontmatterFields, isDefaultTemplate, LEGACY_TEMPLATES, renderCallout } from "../src/format";

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
	const full = (iso: string, matins: "both" | "la" | "en" | "off", titleLanguage: "both" | "la" | "en" = "both") =>
		renderCallout(lookup(iso)!, { titleLanguage, matins, template: defaultTemplate("full", titleLanguage) }).split("\n");

	it("folds the celebration's lesson inside the feast callout, Latin then English", () => {
		const lines = full("2026-09-30", "both");
		const start = lines.indexOf("> > [!festa-matins]- Matins reading");
		expect(start).toBeGreaterThan(0);
		expect(lines[start - 1]).toBe(">");
		expect(lines[start + 1]).toMatch(/^> > Hierónymus, Stridóne in Dalmátia natus/);
		expect(lines).toContain("> > ---");
		expect(lines[lines.length - 1]).toMatch(/^> > .*\S/);
		expect(lines.slice(lines.indexOf("> > ---")).some((l) => l.startsWith("> > Jerome, born at Stridon"))).toBe(true);
		expect(lines.every((l) => l.startsWith(">"))).toBe(true);
	});

	it("uses a commemorated saint's lesson on a day without its own, and says whose it is", () => {
		const lines = full("2026-09-26", "en");
		expect(lines).toContain("> > [!festa-matins]- Matins reading · Sts. Cyprian & Justina");
		expect(lines.some((l) => l.startsWith("> > Cyprian was firstly a warlock"))).toBe(true);
		expect(lines).not.toContain("> > ---");
	});

	it("titles the reading in Latin with the Latin template", () => {
		expect(full("2026-09-26", "la", "la")).toContain("> > [!festa-matins]- Lectio ad Matutinum · Ss. Cypriani et Justinæ Martyrum");
	});

	it("sets the source of a sermon in italics", () => {
		const lines = full("2026-09-29", "la");
		expect(lines).toContain("> > *Sermo sancti Gregórii Papæ*");
	});

	it("disappears when off or when the day has no lesson", () => {
		expect(full("2026-09-30", "off").some((l) => l.includes("festa-matins"))).toBe(false);
		const plainFeria = lookup("2026-10-06")!;
		if (!plainFeria.matins) expect(full("2026-10-06", "both").some((l) => l.includes("festa-matins"))).toBe(false);
	});
});

describe("templates", () => {
	it("recognises shipped and legacy defaults", () => {
		expect(isDefaultTemplate(defaultTemplate("compact", "la"))).toBe(true);
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
