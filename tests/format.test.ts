import { describe, expect, it } from "vitest";
import { lookup } from "../src/calendar";
import { defaultTemplate, frontmatterFields, isDefaultTemplate, LEGACY_TEMPLATES, renderCallout } from "../src/format";

const today = () => lookup("2026-09-26")!;

describe("renderCallout, full layout", () => {
	it("renders today's note as designed", () => {
		expect(renderCallout(today(), { titleLanguage: "both", template: defaultTemplate("full", "both") })).toBe(
			[
				"> [!festa|violet] Ember Saturday of September",
				"> *Sabbato Quattuor Temporum Septembris*",
				">",
				"> II class · 17th week after Pentecost · a.d. VI Kal. Oct.",
				"> Commemoration: Sts. Cyprian & Justina",
			].join("\n"),
		);
	});

	it("drops the commemoration line when there is none", () => {
		const out = renderCallout(lookup("2026-12-25")!, { titleLanguage: "both", template: defaultTemplate("full", "both") });
		expect(out).toBe(
			[
				"> [!festa|white] The Nativity of Our Lord",
				"> *In Nativitate Domini*",
				">",
				"> I class · Octave of Christmas · a.d. VIII Kal. Ian.",
			].join("\n"),
		);
	});

	it("drops the Latin subtitle when it matches the English title", () => {
		const feria = Object.values({ a: lookup("2026-07-07")!, b: lookup("2026-07-08")!, c: lookup("2026-07-09")! }).find(
			(d) => d.celebration.title.en === d.celebration.title.la,
		);
		if (!feria) return;
		const out = renderCallout(feria, { titleLanguage: "both", template: defaultTemplate("full", "both") });
		expect(out).not.toContain("**");
		expect(out.split("\n")[1]).toBe(">");
	});

	it("renders the Latin and English templates", () => {
		expect(renderCallout(today(), { titleLanguage: "la", template: defaultTemplate("full", "la") })).toBe(
			[
				"> [!festa|violet] Sabbato Quattuor Temporum Septembris",
				"> Classis II · Hebdomada XVII post Pentecosten · a.d. VI Kal. Oct.",
				"> Commemoratio: Ss. Cypriani et Justinæ Martyrum",
			].join("\n"),
		);
		expect(renderCallout(today(), { titleLanguage: "en", template: defaultTemplate("full", "en") }).split("\n")[0]).toBe(
			"> [!festa|violet] Ember Saturday of September",
		);
	});
});

describe("renderCallout, compact layout and optional segments", () => {
	it("fits on one line", () => {
		expect(renderCallout(today(), { titleLanguage: "both", template: defaultTemplate("compact", "both") })).toBe(
			"> [!festa|violet] Ember Saturday of September · II class · Comm. Sts. Cyprian & Justina",
		);
		expect(renderCallout(lookup("2026-12-25")!, { titleLanguage: "both", template: defaultTemplate("compact", "both") })).toBe(
			"> [!festa|white] The Nativity of Our Lord · I class",
		);
	});

	it("keeps unknown tokens and plain lines", () => {
		expect(renderCallout(today(), { titleLanguage: "en", template: "Plain line\n{title} {nope}" })).toBe(
			"Plain line\nEmber Saturday of September {nope}",
		);
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
