import type { App, TFile } from "obsidian";
import { lookup } from "./calendar";
import type { FastingDiscipline } from "./fasting";
import { FIELD_SUFFIXES, frontmatterFields, renderCallout, type TitleLanguage } from "./format";
import { CALLOUT_MARKER, dropEmptyFrontmatter, hasMarker, insertAfterFrontmatter, removeCallout, splitFrontmatter } from "./note-text";

export interface StampSettings {
	titleLanguage: TitleLanguage;
	fasting: FastingDiscipline;
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
		const callout = renderCallout(info, s);
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
	if (!lookup(date)) return "out-of-range";
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
