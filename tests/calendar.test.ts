import { describe, expect, it } from "vitest";
import { dataRange, lookup } from "../src/calendar";
import { daysInMonth, toISO } from "../src/dates";

describe("lookup", () => {
	it("resolves every bundled day with titles in both languages", () => {
		const { from, to } = dataRange();
		expect(from).toBe(2020);
		expect(to).toBe(2040);
		let n = 0;
		for (let y = from; y <= to; y++) {
			for (let m = 1; m <= 12; m++) {
				for (let d = 1; d <= daysInMonth(y, m); d++) {
					const info = lookup(toISO({ y, m, d }));
					expect(info).toBeDefined();
					expect(info!.celebration.title.en).not.toBe("");
					expect(info!.celebration.title.la).not.toBe("");
					n++;
				}
			}
		}
		expect(n).toBe(7671);
	});

	it("returns undefined outside the bundled years and for bad input", () => {
		expect(lookup("2019-12-31")).toBeUndefined();
		expect(lookup("2041-01-01")).toBeUndefined();
		expect(lookup("2026-02-30")).toBeUndefined();
		expect(lookup("not a date")).toBeUndefined();
	});

	it("knows today: Ember Saturday of September 2026", () => {
		const info = lookup("2026-09-26")!;
		expect(info.celebration.title).toEqual({
			en: "Ember Saturday of September",
			la: "Sabbato Quattuor Temporum Septembris",
		});
		expect(info.celebration.rank).toBe(2);
		expect(info.celebration.colour).toBe("v");
		expect(info.commemorations.map((c) => c.title.la)).toEqual(["Ss. Cypriani et Justinæ Martyrum"]);
		expect(info.pages).toEqual({ angelus: 785, lasance: 699, baronius: 708 });
		expect(info.weekday).toBe(6);
		expect(info.weekdayLa).toBe("Sabbato");
		expect(info.season).toBe("pentecost");
		expect(info.week).toBe(17);
		expect(info.weekLabel.en).toBe("17th week after Pentecost");
		expect(info.romanDate.short).toBe("a.d. VI Kal. Oct.");
	});

	it("applies the St Joseph override in Passion Week 2027", () => {
		const info = lookup("2027-03-19")!;
		expect(info.celebration.id).toBe("sancti:03-19:1:w");
		expect(info.celebration.rank).toBe(1);
		expect(info.season).toBe("passiontide");
		expect(info.commemorations[0]!.id).toBe("tempora:Quad5-5Feria:3:v");
	});
});

describe("week labels across 2026", () => {
	it.each([
		["2026-01-01", "christmas", "Octave of Christmas"],
		["2026-01-03", "christmas", "Christmastide"],
		["2026-01-08", "epiphany", "After Epiphany"],
		["2026-01-14", "epiphany", "1st week after Epiphany"],
		["2026-02-03", "septuagesima", "Septuagesima week"],
		["2026-02-17", "septuagesima", "Quinquagesima week"],
		["2026-02-18", "lent", "After Ash Wednesday"],
		["2026-02-26", "lent", "1st week of Lent"],
		["2026-03-24", "passiontide", "Passion Week"],
		["2026-04-02", "passiontide", "Holy Week"],
		["2026-04-07", "paschaltide", "Easter Week"],
		["2026-04-21", "paschaltide", "2nd week after Easter"],
		["2026-05-15", "paschaltide", "After the Ascension"],
		["2026-05-19", "paschaltide", "Week after the Ascension"],
		["2026-05-27", "paschaltide", "Whitsun Week"],
		["2026-06-02", "pentecost", "1st week after Pentecost"],
		["2026-11-10", "pentecost", "5th week after Epiphany (resumed)"],
		["2026-11-24", "pentecost", "24th week after Pentecost"],
		["2026-12-02", "advent", "1st week of Advent"],
		["2026-12-24", "advent", "4th week of Advent"],
		["2026-12-26", "christmas", "Octave of Christmas"],
	])("%s is %s / %s", (iso, season, label) => {
		const info = lookup(iso)!;
		expect(info.season).toBe(season);
		expect(info.weekLabel.en).toBe(label);
	});
});

describe("Matins readings", () => {
	it("exist for every first- and second-class saint's feast in the bundled years", () => {
		const { from, to } = dataRange();
		const missing: string[] = [];
		for (let y = from; y <= to; y++) {
			for (let m = 1; m <= 12; m++) {
				for (let d = 1; d <= daysInMonth(y, m); d++) {
					const info = lookup(toISO({ y, m, d }))!;
					if (info.celebration.id.startsWith("sancti:") && info.celebration.rank <= 2 && !info.matins) {
						missing.push(`${info.date} ${info.celebration.title.en}`);
					}
				}
			}
		}
		expect(missing).toEqual([]);
	});

	it("has English for today's commemoration", () => {
		const m = lookup("2026-09-26")!.matins!;
		expect(m.commemoration).toBe(true);
		expect(m.source.title.en).toBe("Sts. Cyprian & Justina");
		expect(m.en).toMatch(/^Cyprian was firstly a warlock/);
	});
});
