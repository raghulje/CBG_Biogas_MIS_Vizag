/**
 * Period-aware trend bucketing for dashboard charts/sparklines.
 * Display-only aggregation of API daily trends — does not alter summary KPIs.
 */

export type TrendPoint = {
  date?: string;
  label?: string;
  rawBiogas?: number;
  cbgProduced?: number;
  cbgSold?: number;
  plantAvailability?: number;
  [key: string]: unknown;
};

export type FilterPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const n = (v: unknown) => Number(v ?? 0) || 0;

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Map API / bucket rows onto independent metric keys.
 * Each field is read separately — never copy one series onto another.
 */
export function normalizeTrendPoint(t: TrendPoint): TrendPoint {
  const raw = t as Record<string, unknown>;
  return {
    ...t,
    date: t.date != null ? String(t.date).slice(0, 10) : t.date,
    label: t.label,
    rawBiogas: n(
      raw.rawBiogas ?? raw.raw_biogas ?? raw.totalRawBiogas ?? raw.total_raw_biogas,
    ),
    cbgProduced: n(
      raw.cbgProduced ?? raw.cbg_produced ?? raw.produced,
    ),
    cbgSold: n(
      raw.cbgSold ?? raw.cbg_sold,
    ),
    plantAvailability: n(
      raw.plantAvailability ?? raw.plant_availability,
    ),
  };
}

function sortTrends(trends: TrendPoint[]) {
  return [...trends]
    .map(normalizeTrendPoint)
    .filter((t) => t.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

/** Sum each metric independently (raw / produced / sold never share a source array). */
function sumBucket(items: TrendPoint[]): TrendPoint {
  let rawBiogas = 0;
  let cbgProduced = 0;
  let cbgSold = 0;
  let plantAvailability = 0;
  items.forEach((item) => {
    const p = normalizeTrendPoint(item);
    rawBiogas += n(p.rawBiogas);
    cbgProduced += n(p.cbgProduced);
    cbgSold += n(p.cbgSold);
    plantAvailability += n(p.plantAvailability);
  });
  return {
    rawBiogas,
    cbgProduced,
    cbgSold,
    plantAvailability: items.length ? plantAvailability / items.length : 0,
  };
}

/** Collapse multiple MIS entries on the same calendar day into one chart point. */
function collapseByDate(trends: TrendPoint[]): TrendPoint[] {
  const buckets = new Map<string, TrendPoint[]>();
  trends.forEach((t) => {
    const p = normalizeTrendPoint(t);
    if (!p.date) return;
    const key = String(p.date).slice(0, 10);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p);
  });
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      ...sumBucket(items),
    }));
}

/** Plant-hour profile weights for a single day → hourly visualization */
function hourlyWeights(hours: number) {
  const weights: number[] = [];
  for (let h = 0; h < hours; h += 1) {
    // Peak mid-day operations, quieter overnight
    const phase = (h / hours) * Math.PI * 2;
    const w = 0.35 + 0.65 * Math.max(0, Math.sin((h - 5) / 14 * Math.PI));
    const micro = 0.92 + Math.sin(phase * 1.7) * 0.08;
    weights.push(Math.max(0.08, w * micro));
  }
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return weights.map((w) => w / total);
}

function expandDayToHours(day: TrendPoint | null, hours = 12): TrendPoint[] {
  const base = day ?? { rawBiogas: 0, cbgProduced: 0, cbgSold: 0 };
  const weights = hourlyWeights(hours);
  const startHour = 6; // 06:00–17:00 typical plant window for 12 slots
  return weights.map((w, i) => {
    const hour = startHour + i;
    return {
      date: base.date,
      label: `${String(hour).padStart(2, '0')}:00`,
      rawBiogas: n(base.rawBiogas) * w,
      cbgProduced: n(base.cbgProduced) * w,
      cbgSold: n(base.cbgSold) * w,
    };
  });
}

function fillContinuousDays(sorted: TrendPoint[], maxDays = 14): TrendPoint[] {
  if (!sorted.length) return [];
  const first = parseDate(sorted[0].date)!;
  const last = parseDate(sorted[sorted.length - 1].date)!;
  const byDay = new Map(sorted.map((t) => [String(t.date).slice(0, 10), t]));

  let start = new Date(first);
  let end = new Date(last);
  const span = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (span > maxDays) {
    end = new Date(last);
    start = new Date(end);
    start.setDate(end.getDate() - (maxDays - 1));
  }

  const out: TrendPoint[] = [];
  for (let c = new Date(start); c <= end; c.setDate(c.getDate() + 1)) {
    const key = dayKey(c);
    const hit = byDay.get(key);
    out.push({
      date: key,
      label: c.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      rawBiogas: n(hit?.rawBiogas),
      cbgProduced: n(hit?.cbgProduced),
      cbgSold: n(hit?.cbgSold),
    });
  }
  return out;
}

function weekOfMonth(d: Date) {
  return Math.ceil(d.getDate() / 7);
}

function aggregateByWeekOfMonth(sorted: TrendPoint[]): TrendPoint[] {
  const buckets = new Map<number, TrendPoint[]>();
  sorted.forEach((t) => {
    const d = parseDate(t.date);
    if (!d) return;
    const w = weekOfMonth(d);
    if (!buckets.has(w)) buckets.set(w, []);
    buckets.get(w)!.push(t);
  });
  const maxWeek = Math.max(4, ...buckets.keys(), 1);
  const out: TrendPoint[] = [];
  for (let w = 1; w <= maxWeek; w += 1) {
    const items = buckets.get(w) ?? [];
    const sum = sumBucket(items);
    out.push({
      ...sum,
      date: `W${w}`,
      label: `Week ${w}`,
    });
  }
  return out;
}

function aggregateByMonth(sorted: TrendPoint[], year?: number): TrendPoint[] {
  const months = year != null
    ? Array.from({ length: 12 }, (_, i) => i)
    : [...new Set(sorted.map((t) => parseDate(t.date)?.getMonth()).filter((m): m is number => m != null))].sort((a, b) => a - b);

  const buckets = new Map<number, TrendPoint[]>();
  sorted.forEach((t) => {
    const d = parseDate(t.date);
    if (!d) return;
    if (year != null && d.getFullYear() !== year) return;
    const m = d.getMonth();
    if (!buckets.has(m)) buckets.set(m, []);
    buckets.get(m)!.push(t);
  });

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const list = year != null ? Array.from({ length: 12 }, (_, i) => i) : months.length ? months : Array.from({ length: 12 }, (_, i) => i);

  return list.map((m) => {
    const sum = sumBucket(buckets.get(m) ?? []);
    return {
      ...sum,
      date: `M${m + 1}`,
      label: labels[m],
    };
  });
}

function aggregateByWeek(sorted: TrendPoint[]): TrendPoint[] {
  const buckets = new Map<string, TrendPoint[]>();
  sorted.forEach((t) => {
    const d = parseDate(t.date);
    if (!d) return;
    // ISO-ish week key: year-week
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const key = `${tmp.getUTCFullYear()}-W${week}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(t);
  });
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, items]) => ({
      ...sumBucket(items),
      date: key,
      label: key.replace(/^\d+-/, ''),
    }));
}

export type PeriodSeriesResult = {
  points: TrendPoint[];
  granularity: 'hour' | 'day' | 'week' | 'month';
  empty: boolean;
};

/**
 * Build chart/sparkline series shaped for the active filter.
 */
export function buildPeriodSeries(
  trends: TrendPoint[],
  filterType: FilterPeriod,
  opts?: { year?: number },
): PeriodSeriesResult {
  const sorted = collapseByDate(sortTrends(trends));
  const empty = !sorted.length;

  if (filterType === 'day') {
    const day = sorted.length ? sumBucket(sorted) : null;
    if (day && sorted[0]?.date) day.date = sorted[0].date;
    const points = expandDayToHours(day, 12);
    return { points, granularity: 'hour', empty };
  }

  if (filterType === 'week') {
    // Prefer a full 7-day window ending on the latest day in the dataset
    if (!sorted.length) {
      return {
        points: Array.from({ length: 7 }, (_, i) => ({
          label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          rawBiogas: 0,
          cbgProduced: 0,
          cbgSold: 0,
        })),
        granularity: 'day' as const,
        empty: true,
      };
    }
    const last = parseDate(sorted[sorted.length - 1].date)!;
    const start = new Date(last);
    start.setDate(last.getDate() - 6);
    const byDay = new Map(sorted.map((t) => [String(t.date).slice(0, 10), t]));
    const points: TrendPoint[] = [];
    for (let c = new Date(start); c <= last; c.setDate(c.getDate() + 1)) {
      const key = dayKey(c);
      const hit = byDay.get(key);
      points.push({
        date: key,
        label: c.toLocaleDateString(undefined, { weekday: 'short' }),
        rawBiogas: n(hit?.rawBiogas),
        cbgProduced: n(hit?.cbgProduced),
        cbgSold: n(hit?.cbgSold),
      });
    }
    return { points, granularity: 'day', empty };
  }

  if (filterType === 'month') {
    const points = sorted.length ? aggregateByWeekOfMonth(sorted) : [1, 2, 3, 4].map((w) => ({
      label: `Week ${w}`,
      rawBiogas: 0,
      cbgProduced: 0,
      cbgSold: 0,
    }));
    return { points, granularity: 'week', empty };
  }

  if (filterType === 'quarter') {
    const points = aggregateByMonth(sorted);
    return {
      points: points.length ? points : ['M1', 'M2', 'M3'].map((label) => ({
        label,
        rawBiogas: 0,
        cbgProduced: 0,
        cbgSold: 0,
      })),
      granularity: 'month',
      empty,
    };
  }

  if (filterType === 'year') {
    const points = aggregateByMonth(sorted, opts?.year);
    return { points, granularity: 'month', empty };
  }

  // custom
  if (sorted.length > 60) {
    return { points: aggregateByWeek(sorted), granularity: 'week', empty };
  }
  if (sorted.length > 31) {
    return { points: aggregateByMonth(sorted), granularity: 'month', empty };
  }
  return { points: fillContinuousDays(sorted, 31), granularity: 'day', empty };
}

export function seriesValues(points: TrendPoint[], key: 'rawBiogas' | 'cbgProduced' | 'cbgSold'): number[] {
  return points.map((p) => n(normalizeTrendPoint(p)[key]));
}

export function quarterDateRange(year: number, quarter: number) {
  const q = Math.min(4, Math.max(1, quarter));
  const startMonth = (q - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return {
    startDate: dayKey(start),
    endDate: dayKey(end),
  };
}
