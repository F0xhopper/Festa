import { describe, expect, it } from "vitest";
import { lookup } from "../src/calendar";
import { dayKind, rankLabel } from "../src/describe";

describe("rankLabel", () => {
	it.each([
		["2026-09-30", "Third-class feast"],
		["2026-09-26", "Second-class Ember day"],
		["2026-09-27", "Second-class Sunday"],
		["2026-12-25", "First-class feast"],
		["2026-12-24", "First-class vigil"],
		["2026-12-30", "Second-class day"],
		["2026-04-07", "First-class day"],
		["2026-05-26", "First-class day"],
		["2026-02-18", "First-class feria"],
		["2026-04-03", "First-class feria"],
		["2026-05-14", "First-class feast"],
		["2026-06-04", "First-class feast"],
		["2026-11-02", "First class"],
		["2026-03-24", "Third-class feria"],
	])("%s is a %s", (iso, label) => {
		const info = lookup(iso)!;
		expect(rankLabel(info.celebration, info.weekday)).toBe(label);
	});

	it("labels Our Lady on Saturday without a noun", () => {
		const info = lookup("2026-01-03")!;
		expect(info.celebration.id.startsWith("commune:")).toBe(true);
		expect(dayKind(info.celebration, info.weekday)).toBe("");
	});
});
