// Minimal runtime stand-in for the parts of the Obsidian API that Festa's modules import.
import moment from "moment";

export { moment };

export function normalizePath(p: string): string {
	return p.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
}

export class TAbstractFile {
	constructor(public path: string) {}
}

export class TFile extends TAbstractFile {
	basename: string;
	extension: string;
	constructor(path: string) {
		super(path);
		const name = path.split("/").pop() ?? path;
		const dot = name.lastIndexOf(".");
		this.basename = dot >= 0 ? name.slice(0, dot) : name;
		this.extension = dot >= 0 ? name.slice(dot + 1) : "";
	}
}
