/**
 * Shared date utilities for week/month calculations.
 * All week calculations use ISO weeks (Monday–Sunday).
 */

/** Returns { start, end } as yyyy-MM-dd for the Monday–Sunday week at the given offset from this week. */
export function getWeekBounds(offset: number): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

/** Returns { start, end } as yyyy-MM-dd for the first/last day of the month at the given offset. */
export function getMonthBounds(offset: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

/** Returns the ISO 8601 week number for a given date. */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday (ISO week algorithm)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Formats a week range label, e.g. "KW 09: 24.02.2026 – 02.03.2026"
 * @param start yyyy-MM-dd
 * @param end yyyy-MM-dd
 */
export function formatWeekLabel(start: string, end: string): string {
  const startDate = new Date(start + "T00:00:00");
  const weekNum = getWeekNumber(startDate);
  const kw = String(weekNum).padStart(2, "0");

  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

  const endDate = new Date(end + "T00:00:00");
  return `KW ${kw}: ${fmt(startDate)} – ${fmt(endDate)}`;
}

/**
 * Returns the week offset (from current week) for a given start date.
 * Used to calculate arrow navigation from a given week.
 */
export function getWeekOffset(start: string): number {
  const currentWeek = getWeekBounds(0);
  const currentMonday = new Date(currentWeek.start + "T00:00:00");
  const givenMonday = new Date(start + "T00:00:00");
  const diffMs = givenMonday.getTime() - currentMonday.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}
