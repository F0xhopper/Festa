import type { App, TFile } from "obsidian";
import { lookup } from "./calendar";
import { frontmatterFields, renderCallout, type TitleLanguage } from "./format";
import { CALLOUT_MARKER, hasMarker, insertAfterFrontmatter, splitFrontmatter } from "./note-text";

export interface StampSettings {
	titleLanguage: TitleLanguage;
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
