import { describe, expect, it } from "vitest";
import { lookup } from "../src/calendar";
import { DEFAULT_TEMPLATES, frontmatterFields, renderCallout } from "../src/format";

describe("renderCallout", () => {
	it("renders today's note exactly as designed", () => {
		const out = renderCallout(lookup("2026-09-26")!, { titleLanguage: "both", template: DEFAULT_TEMPLATES.both });
		expect(out).toBe(
			[
				"> [!festa|violet] Sabbato Quattuor Temporum Septembris",
				"> **Ember Saturday of September** · Class II · violet",
				"> Comm. Ss. Cypriani et Justinæ Martyrum (Sts. Cyprian & Justina)",
				"> Sabbato · 17th week after Pentecost · a.d. VI Kal. Oct.",
				"> Missal: Angelus Press p. 785 · Baronius p. 708 · Lasance p. 699",
			].join("\n"),
		);
	});

	it("drops lines whose tokens are all empty", () => {
		const info = lookup("2026-12-25")!;
		expect(info.commemorations).toHaveLength(0);
		const out = renderCallout(info, { titleLanguage: "both", template: DEFAULT_TEMPLATES.both });
		expect(out).not.toContain("Comm.");
		expect(out.split("\n")[0]).toBe("> [!festa|white] In Nativitate Domini");
	});

	it("keeps unknown tokens and plain lines", () => {
		const out = renderCallout(lookup("2026-09-26")!, {
			titleLanguage: "en",
			template: "Plain line\n{title} {nope}",
		});
		expect(out).toBe("Plain line\nEmber Saturday of September {nope}");
	});

	it("renders the Latin and English templates", () => {
		const info = lookup("2026-09-26")!;
		expect(renderCallout(info, { titleLanguage: "la", template: DEFAULT_TEMPLATES.la }).split("\n")[0]).toBe(
			"> [!festa|violet] Sabbato Quattuor Temporum Septembris · Classis II",
		);
		expect(renderCallout(info, { titleLanguage: "en", template: DEFAULT_TEMPLATES.en }).split("\n")[0]).toBe(
			"> [!festa|violet] Ember Saturday of September · Class II · violet",
		);
	});
});

describe("frontmatterFields", () => {
	it("uses the prefix and omits empty fields", () => {
		expect(frontmatterFields(lookup("2026-09-26")!, "feast")).toEqual({
			feast: "Ember Saturday of September",
			feast_la: "Sabbato Quattuor Temporum Septembris",
			feast_class: 2,
			feast_color: "violet",
			feast_comm: ["Sts. Cyprian & Justina"],
			feast_season: "Time after Pentecost",
			feast_week: 17,
		});
		const xmas = frontmatterFields(lookup("2026-12-25")!, "festa");
		expect(xmas).not.toHaveProperty("festa_comm");
		expect(xmas).not.toHaveProperty("festa_week");
		expect(xmas.festa_color).toBe("white");
	});
});
