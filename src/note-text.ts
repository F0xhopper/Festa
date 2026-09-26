/** Pure helpers for reading and editing note text. No Obsidian imports. */

const FM_OPEN = /^---\r?\n/;

/** Returns [frontmatterBlockIncludingFences, body]. Block is "" when there is no frontmatter. */
export function splitFrontmatter(data: string): [string, string] {
	if (!FM_OPEN.test(data)) return ["", data];
	const lines = data.match(/[^\n]*\n|[^\n]+$/g) ?? [];
	for (let i = 1; i < lines.length; i++) {
		if (/^---\s*$/.test(lines[i] ?? "")) {
			const head = lines.slice(0, i + 1).join("");
			return [head.endsWith("\n") ? head : head + "\n", lines.slice(i + 1).join("")];
		}
	}
	return ["", data];
}

/** Insert a block directly after the frontmatter (or at the top), separated by one blank line. */
export function insertAfterFrontmatter(data: string, block: string): string {
	const [head, body] = splitFrontmatter(data);
	const rest = body.replace(/^\s*\n/, "");
	return head + block + (rest.length ? "\n\n" + rest : "\n");
}

export const CALLOUT_MARKER = "[!festa";

/** True when the note already carries Festa output: the frontmatter key or the callout. */
export function hasMarker(data: string, prefix: string): boolean {
	const [head, body] = splitFrontmatter(data);
	const key = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`, "m");
	return (head !== "" && key.test(head)) || body.includes(CALLOUT_MARKER);
}

/** Remove Festa's callout (the "> [!festa" line and the quoted lines under it) and one blank line after it. */
export function removeCallout(data: string): string {
	const [head, body] = splitFrontmatter(data);
	const lines = body.split("\n");
	const start = lines.findIndex((l) => l.startsWith("> " + CALLOUT_MARKER) || l.startsWith(">" + CALLOUT_MARKER));
	if (start < 0) return data;
	let end = start + 1;
	while (end < lines.length && (lines[end] ?? "").startsWith(">")) end++;
	if (end < lines.length && (lines[end] ?? "").trim() === "") end++;
	lines.splice(start, end - start);
	return head + lines.join("\n");
}

/** Drop a frontmatter block that has no keys left ("---\n---\n"). */
export function dropEmptyFrontmatter(data: string): string {
	const [head, body] = splitFrontmatter(data);
	if (head && /^---\r?\n\s*---\s*$/.test(head)) return body;
	return data;
}
