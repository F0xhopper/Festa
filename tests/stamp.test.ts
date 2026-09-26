import { describe, expect, it } from "vitest";
import { TFile } from "obsidian";
import type { App } from "obsidian";
import { defaultTemplate } from "../src/format";
import { splitFrontmatter } from "../src/note-text";
import { refreshFile, stampFile, type StampSettings } from "../src/stamp";

/** A fake vault holding note text, with a naive processFrontMatter good enough for flat YAML. */
function fakeApp(files: Record<string, string>) {
	const app = {
		vault: {
			read: async (f: TFile) => files[f.path] ?? "",
			process: async (f: TFile, fn: (d: string) => string) => (files[f.path] = fn(files[f.path] ?? "")),
		},
		fileManager: {
			processFrontMatter: async (f: TFile, fn: (fm: Record<string, unknown>) => void) => {
				const [head, body] = splitFrontmatter(files[f.path] ?? "");
				const fm: Record<string, unknown> = {};
				for (const line of head.split("\n").slice(1, -2)) {
					const i = line.indexOf(":");
					if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
				}
				fn(fm);
				const yaml = Object.entries(fm)
					.map(([k, v]) => `${k}: ${Array.isArray(v) ? JSON.stringify(v) : String(v)}`)
					.join("\n");
				files[f.path] = `---\n${yaml}\n---\n${body}`;
			},
		},
	};
	return app as unknown as App;
}

const SETTINGS: StampSettings = {
	titleLanguage: "both",
	template: defaultTemplate("full", "both"),
	frontmatterPrefix: "feast",
	insertFrontmatter: true,
	insertCallout: true,
};

const TEMPLATE = "## Tasks\n[[TODO List]]\n\n## Habits\n- [ ] Lectio Divina\n";

describe("stampFile", () => {
	it("adds properties and the callout above the template, once", async () => {
		const files = { "Daily/2026-09-26.md": TEMPLATE };
		const app = fakeApp(files);
		const file = new TFile("Daily/2026-09-26.md");

		expect(await stampFile(app, file, "2026-09-26", SETTINGS)).toBe("stamped");
		const once = files["Daily/2026-09-26.md"];
		expect(once).toMatch(/^---\nfeast: Ember Saturday of September\n/);
		expect(once).toContain("feast_week: 17");
		expect(once).toContain("---\n> [!festa|violet] Ember Saturday of September\n");
		expect(once).toContain("> *Sabbato Quattuor Temporum Septembris · a.d. VI Kal. Oct.*\n\n## Tasks\n");
		expect(once.endsWith(TEMPLATE)).toBe(true);

		expect(await stampFile(app, file, "2026-09-26", SETTINGS)).toBe("skipped");
		expect(files["Daily/2026-09-26.md"]).toBe(once);
	});

	it("keeps existing properties", async () => {
		const files = { "Daily/2026-12-25.md": "---\nmood: good\n---\nbody\n" };
		await stampFile(fakeApp(files), new TFile("Daily/2026-12-25.md"), "2026-12-25", SETTINGS);
		expect(files["Daily/2026-12-25.md"]).toMatch(/^---\nmood: good\nfeast: The Nativity of Our Lord\n/);
		expect(files["Daily/2026-12-25.md"]).toContain("> [!festa|white] The Nativity of Our Lord\n");
	});

	it("honours the callout-only and properties-only settings", async () => {
		const a = { "n.md": "x\n" };
		await stampFile(fakeApp(a), new TFile("n.md"), "2026-09-26", { ...SETTINGS, insertFrontmatter: false });
		expect(a["n.md"].startsWith("> [!festa|violet]")).toBe(true);
		expect(a["n.md"]).not.toContain("feast:");

		const b = { "n.md": "x\n" };
		await stampFile(fakeApp(b), new TFile("n.md"), "2026-09-26", { ...SETTINGS, insertCallout: false });
		expect(b["n.md"]).toContain("feast: Ember Saturday of September");
		expect(b["n.md"]).not.toContain("[!festa");
	});

	it("leaves notes outside the bundled years untouched", async () => {
		const files = { "Daily/2045-01-01.md": "x\n" };
		expect(await stampFile(fakeApp(files), new TFile("Daily/2045-01-01.md"), "2045-01-01", SETTINGS)).toBe("out-of-range");
		expect(files["Daily/2045-01-01.md"]).toBe("x\n");
	});

	it("does not add a second callout when only the callout is present", async () => {
		const files = { "n.md": "> [!festa|green] Something\n\nbody\n" };
		expect(await stampFile(fakeApp(files), new TFile("n.md"), "2026-09-26", SETTINGS)).toBe("skipped");
	});
});

const OLD_NOTE = [
	"---",
	"mood: good",
	"feast: Ember Saturday of September",
	"feast_la: Sabbato Quattuor Temporum Septembris",
	"feast_class: 2",
	"---",
	"> [!festa|violet] Sabbato Quattuor Temporum Septembris",
	"> **Ember Saturday of September** · Class II · violet",
	"> Missal: Angelus Press p. 785 · Baronius p. 708 · Lasance p. 699",
	"",
	"## Tasks",
	"",
].join("\n");

describe("refreshFile", () => {
	it("replaces the old callout and removes properties when they are turned off", async () => {
		const files = { "Daily/2026-09-26.md": OLD_NOTE };
		const s = { ...SETTINGS, insertFrontmatter: false };
		expect(await refreshFile(fakeApp(files), new TFile("Daily/2026-09-26.md"), "2026-09-26", s)).toBe("stamped");
		expect(files["Daily/2026-09-26.md"]).toBe(
			[
				"---",
				"mood: good",
				"---",
				"> [!festa|violet] Ember Saturday of September",
				"> Second-class Ember day · 17th week after Pentecost",
				"> Commemoration: Sts. Cyprian & Justina",
				"> *Sabbato Quattuor Temporum Septembris · a.d. VI Kal. Oct.*",
				"",
				"## Tasks",
				"",
			].join("\n"),
		);
	});

	it("drops the frontmatter block when only Festa's properties were in it", async () => {
		const files = { "n.md": OLD_NOTE.replace("mood: good\n", "") };
		await refreshFile(fakeApp(files), new TFile("n.md"), "2026-09-26", { ...SETTINGS, insertFrontmatter: false });
		expect(files["n.md"].startsWith("> [!festa|violet] Ember Saturday of September\n")).toBe(true);
	});

	it("is stable when run twice", async () => {
		const files = { "n.md": OLD_NOTE };
		const app = fakeApp(files);
		await refreshFile(app, new TFile("n.md"), "2026-09-26", SETTINGS);
		const once = files["n.md"];
		await refreshFile(app, new TFile("n.md"), "2026-09-26", SETTINGS);
		expect(files["n.md"]).toBe(once);
		expect((once.match(/\[!festa/g) ?? []).length).toBe(1);
	});
});
