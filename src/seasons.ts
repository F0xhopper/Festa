import type { Bilingual, Season, WeekInfo } from "./types";
import type { YMD } from "./dates";

const SEASON_NAME: Record<Season, Bilingual> = {
	advent: { en: "Advent", la: "Tempus Adventus" },
	christmas: { en: "Christmastide", la: "Tempus Nativitatis" },
	epiphany: { en: "Time after Epiphany", la: "Tempus post Epiphaniam" },
	septuagesima: { en: "Septuagesima", la: "Tempus Septuagesimæ" },
	lent: { en: "Lent", la: "Tempus Quadragesimæ" },
	passiontide: { en: "Passiontide", la: "Tempus Passionis" },
	paschaltide: { en: "Paschaltide", la: "Tempus Paschale" },
	pentecost: { en: "Time after Pentecost", la: "Tempus post Pentecosten" },
};

const WEEKDAY_LA = ["Dominica", "Feria II", "Feria III", "Feria IV", "Feria V", "Feria VI", "Sabbato"];

export function weekdayLa(weekday: number): string {
	return WEEKDAY_LA[weekday] ?? "";
}

export function ordinal(n: number): string {
	const mod100 = n % 100;
	if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
	switch (n % 10) {
		case 1:
			return `${n}st`;
		case 2:
			return `${n}nd`;
		case 3:
			return `${n}rd`;
		default:
			return `${n}th`;
	}
}

export function roman(n: number): string {
	const table: [number, string][] = [
		[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
		[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
	];
	let out = "";
	let rest = n;
	for (const [value, numeral] of table) {
		while (rest >= value) {
			out += numeral;
			rest -= value;
		}
	}
	return out;
}

function info(season: Season, week: number | null, en: string, la: string): WeekInfo {
	return { season, seasonName: SEASON_NAME[season], week, weekLabel: { en, la } };
}

/**
 * Season and week label from the bundled week key, which names the Sunday that governs
 * the week in the temporal cycle ("Pent17", "Epi5", "Quad6" …). Using the key rather than
 * counting from Easter keeps the label consistent with the day's Mass, including the
 * Sundays after Epiphany resumed in November.
 */
export function weekInfo(key: string, date: YMD, weekday: number): WeekInfo {
	const match = /^([A-Za-z]+?)(\d*)$/.exec(key);
	const base = match?.[1] ?? key;
	const n = match?.[2] ? Number(match[2]) : 0;

	switch (base) {
		case "Nat": {
			const inOctave = (date.m === 12 && date.d >= 25) || (date.m === 1 && date.d === 1);
			return inOctave
				? info("christmas", null, "Octave of Christmas", "Infra Octavam Nativitatis")
				: info("christmas", null, "Christmastide", "Tempus Nativitatis");
		}
		case "Epi":
			if (n === 0) return info("epiphany", null, "After Epiphany", "Post Epiphaniam");
			if (date.m >= 10) {
				return info(
					"pentecost",
					n,
					`${ordinal(n)} week after Epiphany (resumed)`,
					`Hebdomada ${roman(n)} post Epiphaniam (resumpta)`,
				);
			}
			return info("epiphany", n, `${ordinal(n)} week after Epiphany`, `Hebdomada ${roman(n)} post Epiphaniam`);
		case "Quadp":
			if (n === 1) return info("septuagesima", null, "Septuagesima week", "Hebdomada Septuagesimæ");
			if (n === 2) return info("septuagesima", null, "Sexagesima week", "Hebdomada Sexagesimæ");
			if (weekday >= 3) return info("lent", 0, "After Ash Wednesday", "Post Cineres");
			return info("septuagesima", null, "Quinquagesima week", "Hebdomada Quinquagesimæ");
		case "Quad":
			if (n === 5) return info("passiontide", null, "Passion Week", "Hebdomada Passionis");
			if (n === 6) return info("passiontide", null, "Holy Week", "Hebdomada Sancta");
			return info("lent", n, `${ordinal(n)} week of Lent`, `Hebdomada ${roman(n)} Quadragesimæ`);
		case "Pasc":
			if (n === 0) return info("paschaltide", 0, "Easter Week", "Infra Octavam Paschæ");
			if (n === 5 && weekday >= 4) return info("paschaltide", 5, "After the Ascension", "Post Ascensionem");
			if (n === 6) return info("paschaltide", 6, "Week after the Ascension", "Hebdomada post Ascensionem");
			if (n === 7) return info("paschaltide", 7, "Whitsun Week", "Infra Octavam Pentecostes");
			return info("paschaltide", n, `${ordinal(n)} week after Easter`, `Hebdomada ${roman(n)} post Pascha`);
		case "Pent":
			return info("pentecost", n, `${ordinal(n)} week after Pentecost`, `Hebdomada ${roman(n)} post Pentecosten`);
		case "Adv":
			return info("advent", n, `${ordinal(n)} week of Advent`, `Hebdomada ${roman(n)} Adventus`);
		default:
			throw new Error(`Festa: unknown week key ${key}`);
	}
}
