import type { DayInfo } from "./types";

export type FastingDiscipline = "traditional" | "current" | "off";

export interface FastingInfo {
	en: string;
	la: string;
}

const NONE: FastingInfo = { en: "", la: "" };
const FAST_ABST: FastingInfo = { en: "Fast and abstinence", la: "Jejunium et abstinentia" };
const FAST: FastingInfo = { en: "Fast", la: "Jejunium" };
const ABST: FastingInfo = { en: "Abstinence", la: "Abstinentia" };
const UNTIL_NOON: FastingInfo = { en: "Fast and abstinence until noon", la: "Jejunium et abstinentia usque ad meridiem" };
const FRIDAY_PENANCE: FastingInfo = { en: "Abstinence or another Friday penance", la: "Abstinentia vel alia pænitentia" };

/** Holy days of obligation of the universal Church under the 1917 Code (canon 1247). */
const HOLY_DAYS = [
	"sancti:12-25", // Christmas
	"sancti:01-01", // Circumcision
	"sancti:01-06", // Epiphany
	"sancti:03-19", // St Joseph
	"sancti:06-29", // Sts Peter & Paul
	"sancti:08-15", // Assumption
	"sancti:11-01", // All Saints
	"sancti:12-08", // Immaculate Conception
	"tempora:Pasc5-4", // Ascension
	"tempora:Pent01-4", // Corpus Christi
];

export function isHolyDayOfObligation(info: DayInfo): boolean {
	const id = info.celebration.id;
	return HOLY_DAYS.some((prefix) => id === prefix || id.startsWith(prefix + ":") || id.startsWith(prefix + "m"));
}

const isLent = (info: DayInfo) => info.season === "lent" || info.season === "passiontide";
const isAshWednesday = (info: DayInfo) => info.weekKey === "Quadp3" && info.weekday === 3;
const isGoodFriday = (info: DayInfo) => info.weekKey === "Quad6" && info.weekday === 5;
const isHolySaturday = (info: DayInfo) => info.weekKey === "Quad6" && info.weekday === 6;

/** The fasting vigils of the 1917 Code: Pentecost, the Assumption, All Saints and Christmas. */
function isFastingVigil(info: DayInfo): boolean {
	const md = info.date.slice(5);
	return (info.weekKey === "Pasc6" && info.weekday === 6) || md === "08-14" || md === "10-31" || md === "12-24";
}

/**
 * The 1917 Code (canons 1250–1254), which governed the 1962 Missal: abstinence on Fridays;
 * fast and abstinence on Ash Wednesday, the Fridays and Saturdays of Lent, Ember days and the
 * four vigils; fast alone on the other weekdays of Lent. Nothing on Sundays, nor on holy days
 * of obligation outside Lent, and vigils falling on a Sunday are not anticipated. The fast of
 * Holy Saturday ends at noon.
 */
function traditional(info: DayInfo): FastingInfo {
	if (info.weekday === 0) return NONE;
	if (isHolySaturday(info)) return UNTIL_NOON;
	if (isHolyDayOfObligation(info) && !isLent(info)) return NONE;
	if (isAshWednesday(info) || info.ember || isFastingVigil(info)) return FAST_ABST;
	if (isLent(info)) return info.weekday === 5 || info.weekday === 6 ? FAST_ABST : FAST;
	if (info.weekday === 5) return ABST;
	return NONE;
}

/**
 * The 1983 Code (canons 1250–1253): fast and abstinence on Ash Wednesday and Good Friday,
 * abstinence on the Fridays of Lent, and abstinence or another penance on other Fridays,
 * except when a solemnity falls on a Friday. Bishops' conferences may adapt these.
 */
function current(info: DayInfo): FastingInfo {
	if (isAshWednesday(info) || isGoodFriday(info)) return FAST_ABST;
	if (info.weekday !== 5) return NONE;
	const solemnity = info.celebration.rank === 1 && !info.celebration.id.startsWith("tempora:Quad");
	if (solemnity) return NONE;
	return isLent(info) ? ABST : FRIDAY_PENANCE;
}

export function fasting(info: DayInfo, discipline: FastingDiscipline): FastingInfo {
	if (discipline === "traditional") return traditional(info);
	if (discipline === "current") return current(info);
	return NONE;
}
