/**
 * Calendar utilities using date-fns.
 * Matches server utils/calendarUtils.js so week/month/year work the same everywhere.
 *
 * Week definition: Week 1 = Jan 1 to Jan 7, Week 2 = Jan 8 to Jan 14, etc.
 * Leap years: Handled automatically by date-fns (getDayOfYear, addDays, endOfYear, etc.).
 */

import {
  startOfYear,
  endOfYear,
  getDayOfYear,
  addDays,
  isBefore,
  format,
} from 'date-fns';

/**
 * Get calendar week number (1-based) for a date. Week 1 = Jan 1–7, Week 2 = Jan 8–14, etc.
 */
export function getCalendarWeek(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = getDayOfYear(d);
  const week = Math.floor((dayOfYear - 1) / 7) + 1;
  return Math.min(week, 53);
}

/**
 * Number of calendar weeks in a year (52 or 53).
 */
export function getWeeksInYear(year: number): number {
  const dec31 = endOfYear(new Date(year, 11, 31));
  const dayOfYear = getDayOfYear(dec31);
  return Math.ceil(dayOfYear / 7);
}

/**
 * Get start and end dates for a calendar week. Week 1 = Jan 1–7, etc. End capped at Dec 31.
 */
export function getCalendarWeekRange(
  year: number,
  weekNum: number
): { start: Date; end: Date } {
  const jan1 = startOfYear(new Date(year, 0, 1));
  const start = addDays(jan1, (weekNum - 1) * 7);
  const endCandidate = addDays(start, 6);
  const dec31 = endOfYear(new Date(year, 11, 31));
  const end = isBefore(endCandidate, dec31) ? endCandidate : dec31;
  return { start, end };
}

/**
 * Format a week range for display, e.g. "4 Mar 2024 – 10 Mar 2024"
 */
export function formatWeekRangeLabel(year: number, weekNum: number): string {
  const { start, end } = getCalendarWeekRange(year, weekNum);
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;
}
