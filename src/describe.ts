import type { Observance } from "./types";

const ORDINAL = ["", "First", "Second", "Third", "Fourth"];

/** What kind of day this is, for "Third-class feast", or "" when no noun fits. */
export function dayKind(obs: Pick<Observance, "id" | "title">, weekday: number): string {
	const { id } = obs;
	const en = obs.title.en;
	if (/\bVigil\b/.test(en)) return "vigil";
	if (id.startsWith("sancti:")) return /^Commemoration of All Souls/.test(en) ? "" : "feast";
	if (!id.startsWith("tempora:")) return id.startsWith(":feria") ? "feria" : "";
	if (weekday === 0) return "Sunday";
	if (/^Ember\b/.test(en)) return "Ember day";
	if (/\bOctave\b/.test(en) || /^tempora:Pasc[07]-[1-6]/.test(id)) return "day";
	if (/^(?:Feria|Sabbato|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Ash Wednesday|Good Friday|Holy (?:Thursday|Saturday))\b/.test(en)) {
		return "feria";
	}
	return "feast";
}

/** "Third-class feast", "Second-class Sunday", or "Fourth class" when no noun fits. */
export function rankLabel(obs: Pick<Observance, "id" | "title" | "rank">, weekday: number): string {
	const ord = ORDINAL[obs.rank] ?? "";
	const kind = dayKind(obs, weekday);
	return kind ? `${ord}-class ${kind}` : `${ord} class`;
}
