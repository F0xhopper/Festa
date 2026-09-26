import { describe, expect, it } from "vitest";
import { parseISO } from "../src/dates";
import { romanDate } from "../src/roman-date";

const r = (iso: string) => romanDate(parseISO(iso)!);

describe("romanDate", () => {
	it.each([
		["2026-09-26", "a.d. VI Kal. Oct."],
		["2026-03-15", "Id. Mart."],
		["2026-03-07", "Non. Mart."],
		["2026-01-01", "Kal. Ian."],
		["2026-02-28", "prid. Kal. Mart."],
		["2026-12-31", "prid. Kal. Ian."],
		["2026-05-02", "a.d. VI Non. Mai."],
		["2026-10-06", "prid. Non. Oct."],
		["2026-01-14", "a.d. XIX Kal. Feb."],
		["2026-02-14", "a.d. XVI Kal. Mart."],
		["2026-04-12", "prid. Id. Apr."],
		["2028-02-23", "a.d. VII Kal. Mart."],
		["2028-02-24", "a.d. bis VI Kal. Mart."],
		["2028-02-25", "a.d. VI Kal. Mart."],
		["2028-02-28", "a.d. III Kal. Mart."],
		["2028-02-29", "prid. Kal. Mart."],
	])("%s → %s", (iso, expected) => {
		expect(r(iso).short).toBe(expected);
	});

	it("gives the long form", () => {
		expect(r("2026-09-26").long).toBe("ante diem sextum Kalendas Octobres");
		expect(r("2026-12-25").long).toBe("ante diem octavum Kalendas Ianuarias");
		expect(r("2026-03-15").long).toBe("Idibus Martiis");
		expect(r("2026-10-06").long).toBe("pridie Nonas Octobres");
		expect(r("2028-02-24").long).toBe("ante diem bis sextum Kalendas Martias");
	});
});
