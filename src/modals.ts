import { type App, Modal, Setting } from "obsidian";

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
