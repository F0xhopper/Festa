import { daysInMonth, isLeap, type YMD } from "./dates";

const ABBR = ["Ian.", "Feb.", "Mart.", "Apr.", "Mai.", "Iun.", "Iul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
/** Accusative plural, used after "ante diem …" and "pridie". */
const ACC = [
	"Ianuarias", "Februarias", "Martias", "Apriles", "Maias", "Iunias",
	"Iulias", "Augustas", "Septembres", "Octobres", "Novembres", "Decembres",
];
/** Ablative plural, used on the Kalends, Nones and Ides themselves. */
const ABL = [
	"Ianuariis", "Februariis", "Martiis", "Aprilibus", "Maiis", "Iuniis",
	"Iuliis", "Augustis", "Septembribus", "Octobribus", "Novembribus", "Decembribus",
];
const NUM = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
	"XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX"];
const ORD = ["", "", "", "tertium", "quartum", "quintum", "sextum", "septimum", "octavum", "nonum",
	"decimum", "undecimum", "duodecimum", "tertium decimum", "quartum decimum", "quintum decimum",
	"sextum decimum", "septimum decimum", "duodevicesimum", "undevicesimum"];

const LATE = new Set([3, 5, 7, 10]); // March, May, July, October: Nones on the 7th, Ides on the 15th

type Marker = "Kal." | "Non." | "Id.";
const MARKER_ACC: Record<Marker, string> = { "Kal.": "Kalendas", "Non.": "Nonas", "Id.": "Idus" };
const MARKER_ABL: Record<Marker, string> = { "Kal.": "Kalendis", "Non.": "Nonis", "Id.": "Idibus" };

function on(marker: Marker, m: number) {
	return { short: `${marker} ${ABBR[m - 1]}`, long: `${MARKER_ABL[marker]} ${ABL[m - 1]}` };
}

function before(count: number, marker: Marker, m: number, bis = false) {
	if (count === 2) {
		return { short: `prid. ${marker} ${ABBR[m - 1]}`, long: `pridie ${MARKER_ACC[marker]} ${ACC[m - 1]}` };
	}
	const b = bis ? "bis " : "";
	return {
		short: `a.d. ${b}${NUM[count]} ${marker} ${ABBR[m - 1]}`,
		long: `ante diem ${b}${ORD[count]} ${MARKER_ACC[marker]} ${ACC[m - 1]}`,
	};
}

/** Roman-style date as announced in the Martyrology, e.g. "a.d. VI Kal. Oct.". */
export function romanDate({ y, m, d }: YMD): { short: string; long: string } {
	const nones = LATE.has(m) ? 7 : 5;
	const ides = LATE.has(m) ? 15 : 13;
	const next = m === 12 ? 1 : m + 1;

	if (d === 1) return on("Kal.", m);
	if (d < nones) return before(nones - d + 1, "Non.", m);
	if (d === nones) return on("Non.", m);
	if (d < ides) return before(ides - d + 1, "Id.", m);
	if (d === ides) return on("Id.", m);

	if (m === 2 && isLeap(y)) {
		// The leap day is the doubled sixth day before the Kalends of March (24 February).
		if (d === 24) return before(6, "Kal.", next, true);
		if (d > 24) return before(28 - (d - 1) + 2, "Kal.", next);
		return before(28 - d + 2, "Kal.", next);
	}
	return before(daysInMonth(y, m) - d + 2, "Kal.", next);
}
