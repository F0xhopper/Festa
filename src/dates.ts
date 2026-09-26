/** Plain calendar-date helpers. Dates are handled as y/m/d numbers, never through UTC. */

export interface YMD {
	y: number;
	m: number;
	d: number;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISO(iso: string): YMD | null {
	const match = ISO.exec(iso);
	if (!match) return null;
	const y = Number(match[1]);
	const m = Number(match[2]);
	const d = Number(match[3]);
	if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
	return { y, m, d };
}

export function toISO({ y, m, d }: YMD): string {
	return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isLeap(y: number): boolean {
	return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
	return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] ?? 0;
}

/** 0 = Sunday … 6 = Saturday (Sakamoto). */
export function weekday({ y, m, d }: YMD): number {
	const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
	const yy = m < 3 ? y - 1 : y;
	return (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + (t[m - 1] ?? 0) + d) % 7;
}

/** 0-based day of the year. */
export function dayOfYear({ y, m, d }: YMD): number {
	let n = d - 1;
	for (let i = 1; i < m; i++) n += daysInMonth(y, i);
	return n;
}

export function todayISO(now: Date = new Date()): string {
	return toISO({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}
