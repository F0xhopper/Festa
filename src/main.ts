import { type Editor, type MarkdownFileInfo, type MarkdownView, Notice, Plugin, type TAbstractFile, TFile } from "obsidian";
import { dataRange, lookup } from "./calendar";
import { todayISO } from "./dates";
import { allDailyNotes, dailyNoteLocation, dateForFile } from "./daily-notes";
import { defaultTemplate, frontmatterFields, LEGACY_TEMPLATES, matinsNoteContent, renderCallout } from "./format";
import { ConfirmModal, ReadingModal } from "./modals";
import { hasMarker } from "./note-text";
import { DEFAULT_SETTINGS, type FestaSettings, FestaSettingTab } from "./settings";
import { ensureMatinsNote, refreshFile, stampFile, type StampResult } from "./stamp";

/** Re-check shortly after stamping in case a template plugin rewrote the new file. */
const GUARD_DELAY_MS = 1500;

export default class FestaPlugin extends Plugin {
	settings: FestaSettings = { ...DEFAULT_SETTINGS };
	private timers = new Set<number>();
	private backfillRunning = false;

	/** For Templater and other scripts: app.plugins.plugins.festa.api */
	api = {
		lookup,
		renderCallout: (date: string) => {
			const info = lookup(date);
			return info ? renderCallout(info, this.settings) : "";
		},
		frontmatterFields: (date: string) => {
			const info = lookup(date);
			return info ? frontmatterFields(info, this.settings.frontmatterPrefix) : {};
		},
		dataRange,
	};

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new FestaSettingTab(this.app, this));

		this.addCommand({
			id: "insert-feast-for-note",
			name: "Insert feast for this note",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				const date = file ? dateForFile(file, this.location()) : null;
				if (!file || !date) return false;
				if (!checking) void this.stampWithNotice(file, date);
				return true;
			},
		});

		this.addCommand({
			id: "refresh-feast-for-note",
			name: "Refresh feast for this note",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				const date = file ? dateForFile(file, this.location()) : null;
				if (!file || !date) return false;
				if (!checking) void this.refreshWithNotice(file, date);
				return true;
			},
		});

		this.addCommand({
			id: "insert-feast-callout-at-cursor",
			name: "Insert feast callout here",
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				const date = (ctx.file && dateForFile(ctx.file, this.location())) || todayISO();
				const info = lookup(date);
				if (!info) {
					new Notice(`Festa: no bundled data for ${date.slice(0, 4)}.`);
					return;
				}
				if (this.settings.matinsMode === "note") void ensureMatinsNote(this.app, info, this.settings, false);
				editor.replaceSelection(renderCallout(info, this.settings) + "\n");
			},
		});

		this.addCommand({
			id: "add-feasts-to-all-daily-notes",
			name: "Add feasts to all daily notes",
			callback: () => void this.backfill(),
		});

		this.addCommand({
			id: "refresh-feasts-in-all-daily-notes",
			name: "Refresh feasts in all daily notes",
			callback: () => this.refreshAll(),
		});

		// obsidian://festa?matins=YYYY-MM-DD opens that day's Matins reading.
		this.registerObsidianProtocolHandler("festa", (params) => {
			if (params.matins) this.openMatins(params.matins);
		});

		this.addCommand({
			id: "open-matins-reading",
			name: "Open the reading of the day",
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				this.openMatins((file && dateForFile(file, this.location())) || todayISO());
			},
		});

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(this.app.vault.on("create", (file) => this.onCreate(file)));
			this.registerEvent(this.app.workspace.on("file-open", (file) => this.onOpen(file)));
			this.onOpen(this.app.workspace.getActiveFile());
		});
	}

	onunload(): void {
		for (const t of this.timers) window.clearTimeout(t);
		this.timers.clear();
	}

	async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...((await this.loadData()) as Partial<FestaSettings> | null) };
		// Upgrade an unedited template from an earlier version to the current default.
		if (LEGACY_TEMPLATES.includes(this.settings.template)) {
			this.settings.template = defaultTemplate(this.settings.layout, this.settings.titleLanguage);
			await this.saveSettings();
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	openMatins(date: string): void {
		const info = lookup(date);
		const lang = this.settings.matins === "off" ? "both" : this.settings.matins;
		const markdown = info ? matinsNoteContent(info, lang) : "";
		if (!info || !markdown) {
			new Notice(`Festa: no Matins reading for ${date}.`);
			return;
		}
		new ReadingModal(this.app, markdown, {
			text: "Save as note",
			run: () =>
				void ensureMatinsNote(this.app, info, { matins: lang, matinsFolder: this.settings.matinsFolder }, false).then(
					(file) => file && void this.app.workspace.getLeaf(true).openFile(file),
				),
		}).open();
	}

	private location() {
		return dailyNoteLocation(this.settings);
	}

	private later(ms: number, fn: () => void): void {
		const id = window.setTimeout(() => {
			this.timers.delete(id);
			fn();
		}, ms);
		this.timers.add(id);
	}

	private onCreate(file: TAbstractFile): void {
		if (!this.settings.autoInsert || !(file instanceof TFile)) return;
		const date = dateForFile(file, this.location());
		if (!date) return;

		this.later(this.settings.stampDelayMs, () => {
			void this.stampQuietly(file, date).then((result) => {
				if (result !== "stamped") return;
				this.later(GUARD_DELAY_MS, () => void this.stampQuietly(file, date));
			});
		});
	}

	/** Notes created moments ago are left to the create handler, which waits for templates. */
	private onOpen(file: TFile | null): void {
		if (!file || this.settings.stampOnOpen === "off") return;
		if (Date.now() - file.stat.ctime < 5000) return;
		const date = dateForFile(file, this.location());
		if (!date) return;
		if (this.settings.stampOnOpen === "today" && date !== todayISO()) return;
		void this.stampQuietly(file, date);
	}

	private async stampQuietly(file: TFile, date: string): Promise<StampResult | null> {
		if (!(this.app.vault.getAbstractFileByPath(file.path) instanceof TFile)) return null;
		try {
			const result = await stampFile(this.app, file, date, this.settings);
			if (result === "out-of-range") new Notice(`Festa: no bundled data for ${date.slice(0, 4)}.`);
			return result;
		} catch (err) {
			console.error("Festa: could not add the feast", file.path, err);
			return null;
		}
	}

	private async stampWithNotice(file: TFile, date: string): Promise<void> {
		try {
			const result = await stampFile(this.app, file, date, this.settings);
			const message: Record<StampResult, string> = {
				stamped: "Festa: feast added.",
				skipped: "Festa: this note already has its feast.",
				"out-of-range": `Festa: no bundled data for ${date.slice(0, 4)}.`,
			};
			new Notice(message[result]);
		} catch (err) {
			console.error("Festa: could not add the feast", file.path, err);
			new Notice("Festa: could not add the feast. See the developer console.");
		}
	}

	private async refreshWithNotice(file: TFile, date: string): Promise<void> {
		try {
			const result = await refreshFile(this.app, file, date, this.settings);
			new Notice(result === "out-of-range" ? `Festa: no bundled data for ${date.slice(0, 4)}.` : "Festa: feast refreshed.");
		} catch (err) {
			console.error("Festa: could not refresh the feast", file.path, err);
			new Notice("Festa: could not refresh the feast. See the developer console.");
		}
	}

	private refreshAll(): void {
		if (this.backfillRunning) {
			new Notice("Festa: already updating notes, please wait.");
			return;
		}
		const notes = allDailyNotes(this.app.vault, this.location()).filter(({ date }) => lookup(date) !== undefined);
		if (notes.length === 0) {
			new Notice("Festa: no daily notes to refresh.");
			return;
		}
		new ConfirmModal(
			this.app,
			"Refresh feasts in all daily notes",
			[
				`${notes.length} daily notes will have Festa's callout and properties removed and added again with your current settings.`,
				"Anything you typed inside the feast callout will be lost. The rest of each note is not touched.",
			],
			`Refresh ${notes.length} notes`,
			() => void this.runExclusive(async () => {
				const progress = new Notice(`Festa: refreshing… 0/${notes.length}`, 0);
				let failed = 0;
				for (const [i, { file, date }] of notes.entries()) {
					try {
						await refreshFile(this.app, file, date, this.settings);
					} catch (err) {
						failed++;
						console.error("Festa: could not refresh the feast", file.path, err);
					}
					if ((i + 1) % 25 === 0) progress.setMessage(`Festa: refreshing… ${i + 1}/${notes.length}`);
				}
				progress.hide();
				new Notice(`Festa: refreshed ${notes.length - failed} notes${failed ? `, ${failed} failed (see console)` : ""}.`);
			}),
		).open();
	}

	private async runExclusive(task: () => Promise<void>): Promise<void> {
		if (this.backfillRunning) return;
		this.backfillRunning = true;
		try {
			await task();
		} finally {
			this.backfillRunning = false;
		}
	}

	private async backfill(): Promise<void> {
		if (this.backfillRunning) {
			new Notice("Festa: already adding feasts, please wait.");
			return;
		}
		const notes = allDailyNotes(this.app.vault, this.location());
		const { from, to } = dataRange();
		const inRange = notes.filter(({ date }) => lookup(date) !== undefined);
		const outOfRange = notes.length - inRange.length;

		const todo: typeof inRange = [];
		for (const n of inRange) {
			if (!hasMarker(await this.app.vault.cachedRead(n.file), this.settings.frontmatterPrefix)) todo.push(n);
		}
		const already = inRange.length - todo.length;

		if (todo.length === 0) {
			new Notice(`Festa: all ${inRange.length} daily notes already have their feast.`);
			return;
		}

		new ConfirmModal(
			this.app,
			"Add feasts to daily notes",
			[
				`${todo.length} daily notes will get their feast.`,
				`${already} already have it${outOfRange ? `, and ${outOfRange} fall outside ${from}–${to}` : ""} and will not be touched.`,
				"This edits the notes in place.",
			],
			`Add to ${todo.length} notes`,
			() => void this.runBackfill(todo),
		).open();
	}

	private async runBackfill(todo: { file: TFile; date: string }[]): Promise<void> {
		await this.runExclusive(() => this.stampAll(todo));
	}

	private async stampAll(todo: { file: TFile; date: string }[]): Promise<void> {
		const progress = new Notice(`Festa: adding feasts… 0/${todo.length}`, 0);
		let stamped = 0;
		let failed = 0;
		for (const [i, { file, date }] of todo.entries()) {
			try {
				if ((await stampFile(this.app, file, date, this.settings)) === "stamped") stamped++;
			} catch (err) {
				failed++;
				console.error("Festa: could not add the feast", file.path, err);
			}
			if ((i + 1) % 25 === 0) progress.setMessage(`Festa: adding feasts… ${i + 1}/${todo.length}`);
		}
		progress.hide();
		new Notice(`Festa: added the feast to ${stamped} notes${failed ? `, ${failed} failed (see console)` : ""}.`);
	}
}
