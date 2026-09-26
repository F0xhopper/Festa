import { describe, expect, it } from "vitest";
import { lookup } from "../src/calendar";
import { fasting } from "../src/fasting";

const trad = (iso: string) => fasting(lookup(iso)!, "traditional").en;
const now = (iso: string) => fasting(lookup(iso)!, "current").en;

describe("1962 discipline (1917 Code)", () => {
	it.each([
		["2026-09-23", "Fast and abstinence", "Ember Wednesday"],
		["2026-09-25", "Fast and abstinence", "Ember Friday"],
		["2026-09-26", "Fast and abstinence", "Ember Saturday"],
		["2026-12-18", "Fast and abstinence", "Advent Ember Friday"],
		["2026-10-01", "", "ordinary Thursday"],
		["2026-10-02", "Abstinence", "ordinary Friday"],
		["2026-01-02", "Abstinence", "Friday in Christmastide"],
		["2026-02-18", "Fast and abstinence", "Ash Wednesday"],
		["2026-02-19", "Fast", "Lenten Thursday"],
		["2026-02-20", "Fast and abstinence", "Lenten Friday"],
		["2026-02-21", "Fast and abstinence", "Lenten Saturday"],
		["2026-02-22", "", "Sunday of Lent"],
		["2026-03-19", "Fast", "St Joseph in Lent does not lift the fast"],
		["2026-04-03", "Fast and abstinence", "Good Friday"],
		["2026-04-04", "Fast and abstinence until noon", "Holy Saturday"],
		["2026-05-23", "Fast and abstinence", "Vigil of Pentecost"],
		["2026-08-14", "Fast and abstinence", "Vigil of the Assumption"],
		["2026-10-31", "Fast and abstinence", "Vigil of All Saints"],
		["2026-12-24", "Fast and abstinence", "Christmas Eve"],
		["2026-12-25", "", "Christmas on a Friday"],
		["2027-01-01", "", "Circumcision on a Friday"],
		["2027-10-31", "", "vigil on a Sunday is not anticipated"],
	])("%s: %s (%s)", (iso, expected) => {
		expect(trad(iso)).toBe(expected);
	});

	it("has Latin wording", () => {
		expect(fasting(lookup("2026-09-26")!, "traditional").la).toBe("Jejunium et abstinentia");
	});
});

describe("current law (1983 Code)", () => {
	it.each([
		["2026-02-18", "Fast and abstinence"],
		["2026-04-03", "Fast and abstinence"],
		["2026-02-20", "Abstinence"],
		["2026-03-27", "Abstinence"],
		["2026-10-02", "Abstinence or another Friday penance"],
		["2026-09-26", ""],
		["2026-02-19", ""],
		["2026-12-25", ""],
		["2026-06-12", ""],
	])("%s: %s", (iso, expected) => {
		expect(now(iso)).toBe(expected);
	});
});

describe("off", () => {
	it("shows nothing", () => {
		expect(fasting(lookup("2026-02-18")!, "off").en).toBe("");
	});
});
