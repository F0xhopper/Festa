import { type App, Component, MarkdownRenderer, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
	private done = false;

	constructor(
		app: App,
		private readonly heading: string,
		private readonly body: string[],
		private readonly confirmText: string,
		private readonly onConfirm: () => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle(this.heading);
		for (const line of this.body) this.contentEl.createEl("p", { text: line });
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()))
			.addButton((b) =>
				b
					.setButtonText(this.confirmText)
					.setCta()
					.onClick(() => {
						this.done = true;
						this.close();
					}),
			);
	}

	onClose(): void {
		this.contentEl.empty();
		if (this.done) this.onConfirm();
	}
}

/** Shows a Matins reading rendered from Markdown, with an optional action button. */
export class ReadingModal extends Modal {
	private readonly component = new Component();

	constructor(
		app: App,
		private readonly markdown: string,
		private readonly action: { text: string; run: () => void } | null,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("festa-reading-modal");
		const body = this.contentEl.createDiv({ cls: "festa-reading" });
		this.component.load();
		void MarkdownRenderer.render(this.app, this.markdown, body, "", this.component);
		if (this.action) {
			const { text, run } = this.action;
			new Setting(this.contentEl).addButton((b) =>
				b.setButtonText(text).onClick(() => {
					this.close();
					run();
				}),
			);
		}
	}

	onClose(): void {
		this.component.unload();
		this.contentEl.empty();
	}
}
