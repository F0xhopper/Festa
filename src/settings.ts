import { type App, PluginSettingTab, Setting } from "obsidian";
import { dataRange } from "./calendar";
import { dailyNoteLocation } from "./daily-notes";
import type { FastingDiscipline } from "./fasting";
import {
	DEFAULT_MATINS_FOLDER,
	DEFAULT_SHOW,
	defaultTemplate,
	type ShowOptions,
	type Layout,
	type MatinsLanguage,
	type MatinsMode,
	TOKENS,
	type TitleLanguage,
} from "./format";
import type FestaPlugin from "./main";

export interface FestaSettings {
	titleLanguage: TitleLanguage;
	layout: Layout;
	show: ShowOptions;
	fasting: FastingDiscipline;
	matins: MatinsLanguage;
	matinsFolder: string;
	matinsMode: MatinsMode;
	template: string;
	insertFrontmatter: boolean;
	frontmatterPrefix: string;
	insertCallout: boolean;
	autoInsert: boolean;
	stampOnOpen: "today" | "any" | "off";
	folderOverride: string;
	dateFormatOverride: string;
	stampDelayMs: number;
}

export const DEFAULT_SETTINGS: FestaSettings = {
	titleLanguage: "both",
	layout: "full",
	show: { ...DEFAULT_SHOW },
	fasting: "traditional",
	matins: "off",
	matinsFolder: DEFAULT_MATINS_FOLDER,
	matinsMode: "popup",
	/** Empty means: build the template from the options above. */
	template: "",
	insertFrontmatter: true,
	frontmatterPrefix: "feast",
	insertCallout: true,
	autoInsert: true,
	stampOnOpen: "today",
	folderOverride: "",
	dateFormatOverride: "",
	stampDelayMs: 500,
};

const PREFIX_RE = /^[a-z][a-z0-9_]*$/;

export class FestaSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: FestaPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		const s = this.plugin.settings;
		containerEl.empty();

		new Setting(containerEl).setName("Display").setHeading();

		new Setting(containerEl)
			.setName("Title language")
			.setDesc("Language for the feast title and commemorations in the callout.")
			.addDropdown((d) =>
				d
					.addOptions({ both: "Latin and English", la: "Latin", en: "English" })
					.setValue(s.titleLanguage)
					.onChange(async (value) => {
						s.titleLanguage = value as TitleLanguage;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		new Setting(containerEl)
			.setName("Layout")
			.setDesc("Full puts each detail on its own line. Compact fits the feast on one line.")
			.addDropdown((d) =>
				d
					.addOptions({ full: "Full", compact: "Compact" })
					.setValue(s.layout)
					.onChange(async (value) => {
						s.layout = value as Layout;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		const toggles: [keyof ShowOptions, string, string][] = [
			["rank", "Show rank and week", "For example: third-class feast · 18th week after Pentecost."],
			["commemorations", "Show commemorations", "Saints commemorated on the day."],
			["readings", "Show the readings", "The Epistle and Gospel of the day's Mass."],
			["latin", "Show the Latin title and Roman date", "For example: S. Hieronymi … · prid. Kal. Oct."],
		];
		for (const [key, name, desc] of toggles) {
			new Setting(containerEl)
				.setName(name)
				.setDesc(desc)
				.addToggle((t) =>
					t.setValue(s.show[key]).onChange(async (value) => {
						s.show = { ...s.show, [key]: value };
						await this.plugin.saveSettings();
					}),
				);
		}

		new Setting(containerEl)
			.setName("Fasting and abstinence")
			.setDesc("Which rules to use for marking fast and abstinence days.")
			.addDropdown((d) =>
				d
					.addOptions({ traditional: "1962 discipline", current: "Current law", off: "Don't show" })
					.setValue(s.fasting)
					.onChange(async (value) => {
						s.fasting = value as FastingDiscipline;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Matins reading")
			.setDesc("Link to the reading about the saint or feast from the night office.")
			.addDropdown((d) =>
				d
					.addOptions({ both: "Latin and English", la: "Latin", en: "English", off: "Don't show" })
					.setValue(s.matins)
					.onChange(async (value) => {
						s.matins = value as MatinsLanguage;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Open the reading")
			.setDesc("In a window opens the reading without creating any files. As a note creates one note per saint or feast in a folder and links to it.")
			.addDropdown((d) =>
				d
					.addOptions({ popup: "In a window", note: "As a note" })
					.setValue(s.matinsMode)
					.onChange(async (value) => {
						s.matinsMode = value as MatinsMode;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (s.matinsMode === "note") {
			new Setting(containerEl)
				.setName("Matins notes folder")
				.setDesc("Where the reading notes are kept.")
				.addText((t) =>
					t.setValue(s.matinsFolder).onChange(async (value) => {
						s.matinsFolder = value.trim() || DEFAULT_MATINS_FOLDER;
						await this.plugin.saveSettings();
					}),
				);
		}

		const templateSetting = new Setting(containerEl)
			.setName("Custom template")
			.setDesc(
				`Leave empty to use the options above. Tokens: ${TOKENS.map((t) => `{${t}}`).join(" ")}. A line whose tokens are all empty is left out, and so is an optional part written as [? … ?].`,
			)
			.addTextArea((t) => {
				t.setPlaceholder(defaultTemplate(s.layout, s.titleLanguage, s.show));
				t.setValue(s.template).onChange(async (value) => {
					s.template = value;
					await this.plugin.saveSettings();
				});
				t.inputEl.rows = 6;
				t.inputEl.addClass("festa-template-input");
			})
			.addExtraButton((b) =>
				b
					.setIcon("copy")
					.setTooltip("Start from the current default")
					.onClick(async () => {
						s.template = defaultTemplate(s.layout, s.titleLanguage, s.show);
						await this.plugin.saveSettings();
						this.display();
					}),
			);
		templateSetting.settingEl.addClass("festa-template-setting");

		new Setting(containerEl)
			.setName("Insert callout")
			.setDesc("Add the feast callout at the top of the note body.")
			.addToggle((t) =>
				t.setValue(s.insertCallout).onChange(async (value) => {
					s.insertCallout = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Insert properties")
			.setDesc("Add the feast as note properties, so it can be searched and queried.")
			.addToggle((t) =>
				t.setValue(s.insertFrontmatter).onChange(async (value) => {
					s.insertFrontmatter = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Property prefix")
			.setDesc("Property names start with this, for example feast, feast_la, feast_class. Lowercase letters, digits and underscores.")
			.addText((t) =>
				t.setValue(s.frontmatterPrefix).onChange(async (value) => {
					const v = value.trim();
					t.inputEl.toggleClass("festa-invalid", !PREFIX_RE.test(v));
					if (!PREFIX_RE.test(v)) return;
					s.frontmatterPrefix = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl).setName("Daily notes").setHeading();

		new Setting(containerEl)
			.setName("Add automatically")
			.setDesc("Add the feast when a new daily note is created.")
			.addToggle((t) =>
				t.setValue(s.autoInsert).onChange(async (value) => {
					s.autoInsert = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Add when opening")
			.setDesc("Add the feast to a daily note that has none when you open it. This covers notes you created ahead of time.")
			.addDropdown((d) =>
				d
					.addOptions({ today: "Today's note only", any: "Any daily note", off: "Never" })
					.setValue(s.stampOnOpen)
					.onChange(async (value) => {
						s.stampOnOpen = value as FestaSettings["stampOnOpen"];
						await this.plugin.saveSettings();
					}),
			);

		const loc = dailyNoteLocation(s);
		new Setting(containerEl)
			.setName("Folder override")
			.setDesc(`Leave empty to follow your daily notes settings. Currently using: ${loc.folder || "vault root"}.`)
			.addText((t) =>
				t
					.setPlaceholder("Daily")
					.setValue(s.folderOverride)
					.onChange(async (value) => {
						s.folderOverride = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Date format override")
			.setDesc(`Moment.js format of daily note names. Leave empty to follow your daily notes settings. Currently using: ${loc.format}.`)
			.addText((t) =>
				t
					.setValue(s.dateFormatOverride)
					.onChange(async (value) => {
						s.dateFormatOverride = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Delay after creation")
			.setDesc("Milliseconds to wait before adding the feast, so templates can finish first.")
			.addText((t) =>
				t.setValue(String(s.stampDelayMs)).onChange(async (value) => {
					const n = Number(value);
					if (!Number.isFinite(n) || n < 0 || n > 10000) return;
					s.stampDelayMs = Math.round(n);
					await this.plugin.saveSettings();
				}),
			);

		const range = dataRange();
		new Setting(containerEl).setName("About the data").setHeading();
		containerEl.createEl("p", {
			cls: "setting-item-description",
			text: `Bundled calendar: ${range.from}–${range.to}, 1962 rubrics, generated ${range.generated} from Missale Meum (commit ${range.commit}). No network access is used.`,
		});
	}
}
