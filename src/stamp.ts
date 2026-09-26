import { type App, TFile } from "obsidian";
import { lookup } from "./calendar";
import type { FastingDiscipline } from "./fasting";
import {
	FIELD_SUFFIXES,
	frontmatterFields,
	type MatinsLanguage,
	type MatinsMode,
	matinsNoteContent,
	matinsNotePath,
	effectiveTemplate,
	type Layout,
	renderCallout,
	type ShowOptions,
	type TitleLanguage,
} from "./format";
import type { DayInfo } from "./types";
import { CALLOUT_MARKER, dropEmptyFrontmatter, hasMarker, insertAfterFrontmatter, removeCallout, splitFrontmatter } from "./note-text";

export interface StampSettings {
	titleLanguage: TitleLanguage;
	layout?: Layout;
	show?: ShowOptions;
	fasting: FastingDiscipline;
	matins: MatinsLanguage;
	matinsFolder: string;
	matinsMode: MatinsMode;
	template: string;
	frontmatterPrefix: string;
	insertFrontmatter: boolean;
	insertCallout: boolean;
}

export type StampResult = "stamped" | "skipped" | "out-of-range";

/**
 * Add Festa's frontmatter and callout to a daily note, once. Idempotence is decided from the
 * file's text rather than the metadata cache, because the cache lags right after creation.
 */
export async function stampFile(app: App, file: TFile, date: string, s: StampSettings): Promise<StampResult> {
	const info = lookup(date);
	if (!info) return "out-of-range";
	if (!s.insertFrontmatter && !s.insertCallout) return "skipped";

	const current = await app.vault.read(file);
	if (hasMarker(current, s.frontmatterPrefix)) return "skipped";

	if (s.insertFrontmatter) {
		const fields = frontmatterFields(info, s.frontmatterPrefix);
		await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
			Object.assign(fm, fields);
		});
	}
	if (s.insertCallout) {
		if (s.matinsMode === "note") await ensureMatinsNote(app, info, s, false);
		const callout = renderCallout(info, { ...s, template: effectiveTemplate({ ...s, layout: s.layout ?? "full" }) });
		await app.vault.process(file, (data) => {
			const [, body] = splitFrontmatter(data);
			return body.includes(CALLOUT_MARKER) ? data : insertAfterFrontmatter(data, callout);
		});
	}
	return "stamped";
}

/**
 * Remove everything Festa added to a note (its callout and any of its properties under the
 * current prefix), then add the feast again with the current settings.
 */
export async function refreshFile(app: App, file: TFile, date: string, s: StampSettings): Promise<StampResult> {
	const info = lookup(date);
	if (!info) return "out-of-range";
	if (s.insertCallout && s.matinsMode === "note") await ensureMatinsNote(app, info, s, true);
	const current = await app.vault.read(file);
	const [head] = splitFrontmatter(current);
	const keys = FIELD_SUFFIXES.map((suffix) => s.frontmatterPrefix + suffix);
	if (head && keys.some((k) => new RegExp(`^${k}\\s*:`, "m").test(head))) {
		await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
			for (const k of keys) delete fm[k];
		});
	}
	await app.vault.process(file, (data) => dropEmptyFrontmatter(removeCallout(data)));
	return stampFile(app, file, date, s);
}

/**
 * Write the Matins note the daily note links to. Festa owns these notes: an existing one is
 * rewritten only when refreshing, so the text follows the current language setting.
 */
export async function ensureMatinsNote(
	app: App,
	info: DayInfo,
	s: Pick<StampSettings, "matins" | "matinsFolder">,
	overwrite: boolean,
): Promise<TFile | null> {
	const path = matinsNotePath(info, s.matinsFolder);
	const content = matinsNoteContent(info, s.matins);
	if (!path || !content) return null;
	const existing = app.vault.getAbstractFileByPath(path);
	if (existing instanceof TFile) {
		if (overwrite) await app.vault.process(existing, (old) => (old === content ? old : content));
		return existing;
	}
	const parts = path.split("/").slice(0, -1);
	for (let i = 1; i <= parts.length; i++) {
		const dir = parts.slice(0, i).join("/");
		if (!app.vault.getAbstractFileByPath(dir)) await app.vault.createFolder(dir);
	}
	return app.vault.create(path, content);
}
