/**
 * Calendar utilities using date-fns.
 * Single source of truth for week/month/year ranges so the plant calendar works consistently.
 *
 * Week definition: Week 1 = Jan 1 to Jan 7, Week 2 = Jan 8 to Jan 14, etc.
 * (Calendar week from start of year, not ISO week.)
 *
 * Leap years: Handled automatically by date-fns (getDayOfYear, addDays, endOfYear, etc.).
 * No extra logic needed — Feb 29 and 366-day years work correctly.
 */

const {
    startOfYear,
    endOfYear,
    startOfMonth,
    endOfMonth,
    addDays,
    getDayOfYear,
    format,
    isBefore
} = require('date-fns');

/**
 * Get calendar week number (1-based) for a date. Week 1 = Jan 1–7, Week 2 = Jan 8–14, etc.
 * @param {Date} date
 * @returns {number} 1–53
 */
function getCalendarWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfYear = getDayOfYear(d);
    const week = Math.floor((dayOfYear - 1) / 7) + 1;
    return Math.min(week, 53);
}

/**
 * Get start and end dates for a calendar week in a year.
 * Week 1 = Jan 1 to Jan 7, Week 2 = Jan 8 to Jan 14, etc. End is capped at Dec 31.
 * @param {number} year
 * @param {number} weekNum 1–53
 * @returns {{ start: Date, end: Date }}
 */
function getCalendarWeekRange(year, weekNum) {
    const jan1 = startOfYear(new Date(year, 0, 1));
    const start = addDays(jan1, (weekNum - 1) * 7);
    const endCandidate = addDays(start, 6);
    const dec31 = endOfYear(new Date(year, 11, 31));
    const end = isBefore(endCandidate, dec31) ? endCandidate : dec31;
    return { start, end };
}

/**
 * Number of calendar weeks in a year (52 or 53).
 * @param {number} year
 * @returns {number}
 */
function getWeeksInYear(year) {
    const dec31 = endOfYear(new Date(year, 11, 31));
    const dayOfYear = getDayOfYear(dec31);
    return Math.ceil(dayOfYear / 7);
}

/**
 * Get start and end of a month. Uses date-fns for consistency.
 * @param {number} year
 * @param {number} month 1–12
 * @returns {{ start: Date, end: Date }}
 */
function getMonthRange(year, month) {
    const d = new Date(year, month - 1, 1);
    return {
        start: startOfMonth(d),
        end: endOfMonth(d)
    };
}

/**
 * Get start and end of a year.
 * @param {number} year
 * @returns {{ start: Date, end: Date }}
 */
function getYearRange(year) {
    const d = new Date(year, 0, 1);
    return {
        start: startOfYear(d),
        end: endOfYear(d)
    };
}

/**
 * Format date as YYYY-MM-DD for API/DB.
 * @param {Date} d
 * @returns {string}
 */
function toDateString(d) {
    return format(d, 'yyyy-MM-dd');
}

module.exports = {
    getCalendarWeek,
    getCalendarWeekRange,
    getWeeksInYear,
    getMonthRange,
    getYearRange,
    toDateString
};
