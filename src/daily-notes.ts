import { moment, normalizePath, type TAbstractFile, TFile, type Vault } from "obsidian";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

export interface DailyNoteLocation {
	folder: string;
	format: string;
	/** Where the values came from, for the settings tab. */
	source: "override" | "daily notes";
}

export interface LocationOverrides {
	folderOverride: string;
	dateFormatOverride: string;
}

export function dailyNoteLocation(overrides: LocationOverrides): DailyNoteLocation {
	const detected = getDailyNoteSettings() ?? {};
	const folder = overrides.folderOverride.trim() || detected.folder || "";
	const format = overrides.dateFormatOverride.trim() || detected.format || "YYYY-MM-DD";
	const source = overrides.folderOverride.trim() || overrides.dateFormatOverride.trim() ? "override" : "daily notes";
	return { folder: folder === "/" ? "" : normalizePath(folder).replace(/^\/$/, ""), format, source };
}

/**
 * The calendar date a daily note stands for, as "YYYY-MM-DD", or null when the file is not a
 * daily note. The date comes from the moment's own fields, never through UTC, so it cannot
 * shift across a timezone boundary.
 */
export function dateForFile(file: TAbstractFile, loc: DailyNoteLocation): string | null {
	if (!(file instanceof TFile) || file.extension !== "md") return null;
	const prefix = loc.folder ? loc.folder + "/" : "";
	if (prefix && !file.path.startsWith(prefix)) return null;

	const relative = file.path.slice(prefix.length).replace(/\.md$/, "");
	const lastSegmentFormat = loc.format.split("/").pop() ?? loc.format;
	for (const [text, format] of [
		[relative, loc.format],
		[file.basename, lastSegmentFormat],
	] as const) {
		const parsed = moment(text, format, true);
		if (parsed.isValid()) return parsed.format("YYYY-MM-DD");
	}
	return null;
}

export function allDailyNotes(vault: Vault, loc: DailyNoteLocation): { file: TFile; date: string }[] {
	const out: { file: TFile; date: string }[] = [];
	for (const file of vault.getMarkdownFiles()) {
		const date = dateForFile(file, loc);
		if (date) out.push({ file, date });
	}
	return out.sort((a, b) => a.date.localeCompare(b.date));
}
