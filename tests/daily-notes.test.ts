import { describe, expect, it } from "vitest";
import { TFile } from "obsidian";
import { dailyNoteLocation, dateForFile } from "../src/daily-notes";

const NONE = { folderOverride: "", dateFormatOverride: "" };

describe("dateForFile", () => {
	const loc = dailyNoteLocation(NONE);

	it("reads the folder and format from the daily notes settings", () => {
		expect(loc).toEqual({ folder: "Daily", format: "YYYY-MM-DD", source: "daily notes" });
	});

	it("recognises daily notes", () => {
		expect(dateForFile(new TFile("Daily/2026-09-26.md"), loc)).toBe("2026-09-26");
	});

	it("ignores other notes", () => {
		expect(dateForFile(new TFile("TODO List.md"), loc)).toBeNull();
		expect(dateForFile(new TFile("2026-09-26.md"), loc)).toBeNull();
		expect(dateForFile(new TFile("Daily/2026-09-26.canvas"), loc)).toBeNull();
		expect(dateForFile(new TFile("Daily/2026-02-30.md"), loc)).toBeNull();
		expect(dateForFile(new TFile("Daily/Weekly review.md"), loc)).toBeNull();
	});

	it("supports nested formats and overrides", () => {
		const nested = dailyNoteLocation({ folderOverride: "Journal", dateFormatOverride: "YYYY/MM/DD MMMM YYYY" });
		expect(nested.source).toBe("override");
		expect(dateForFile(new TFile("Journal/2026/09/26 September 2026.md"), nested)).toBe("2026-09-26");

		const root = dailyNoteLocation({ folderOverride: "/", dateFormatOverride: "DD-MM-YYYY" });
		expect(dateForFile(new TFile("26-09-2026.md"), root)).toBe("2026-09-26");
	});
});
