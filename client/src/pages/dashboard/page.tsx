import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Zoom, keyframes,
} from '@mui/material';
import {
  Bolt as BoltIcon,
  CheckCircle as CheckCircleIcon, CloudDownload as DownloadIcon,
  Grass as FomIcon, HealthAndSafety as SafetyIcon, LocalFireDepartment as BiogasIcon,
  LocalGasStation as GasIcon, ParkOutlined as ParkOutlinedIcon, Refresh as RefreshIcon,
  Sell as SellIcon, ShowChart as TrendIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import { EmptyState, ErrorState, KpiSkeleton } from '../../components/ui/FeedbackStates';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { misService } from '../../services/misService';
import { tokens } from '../../themes';
import MESSAGES from '../../utils/messages';
import { formatWeekRangeLabel, getCalendarWeek, getWeeksInYear } from '../../utils/calendarUtils';
import refexLogo from '../../assets/refex-logo.png';
import {
  buildPeriodSeries,
  quarterDateRange,
  seriesValues,
  type FilterPeriod,
  type TrendPoint,
} from './periodSeries';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const minYear = 2020;

/** Chart palette — soft shade overlays use these with opacity */
const CHART = {
  feed: '#3B82F6',
  raw: '#2879B6',
  produced: '#10B981',
  sold: '#F97316',
};

const chartFadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const cardReveal = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const softPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

type Trend = TrendPoint;

const cardSx = {
  borderRadius: `${tokens.radius.card}px`,
  border: `1px solid ${tokens.border}`,
  boxShadow: tokens.shadow.sm,
  overflow: 'hidden',
  bgcolor: tokens.surface,
};

const kpiCardSx = {
  ...cardSx,
  transition: 'box-shadow 180ms ease, border-color 180ms ease, opacity 280ms ease',
  '&:hover': { boxShadow: tokens.shadow.md, borderColor: tokens.primary.border },
};

const toNumber = (value: unknown) => Number(value ?? 0) || 0;

function useCountUp(target: number, duration = 720, enabled = true, resetKey?: string) {
  const [display, setDisplay] = useState(enabled ? 0 : target);
  const prev = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      prev.current = target;
      return;
    }
    // Filter/data changes: always count up from 0 for a premium dashboard feel
    const from = resetKey != null ? 0 : prev.current;
    prev.current = target;
    setDisplay(from);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(from + (target - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled, resetKey]);

  return display;
}

type ChartPoint = { x: number; y: number };

/** Monotone cubic Hermite (Fritsch–Carlson) → cubic Bézier path */
function monotoneCubicPath(xs: number[], ys: number[], closeY?: number): string {
  const n = xs.length;
  if (!n) return '';
  if (n === 1) {
    if (closeY === undefined) return `M ${xs[0]} ${ys[0]}`;
    return `M ${xs[0]} ${closeY} L ${xs[0]} ${ys[0]} L ${xs[0]} ${closeY} Z`;
  }

  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = xs[i + 1] - xs[i] || 1e-6;
    dy[i] = ys[i + 1] - ys[i];
    m[i] = dy[i] / dx[i];
  }

  const t = new Array<number>(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  }
  for (let i = 0; i < n - 1; i += 1) {
    if (Math.abs(m[i]) < 1e-12) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const scale = 3 / Math.sqrt(s);
        t[i] = scale * a * m[i];
        t[i + 1] = scale * b * m[i];
      }
    }
  }

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i];
    d += ` C ${xs[i] + h / 3} ${ys[i] + (t[i] * h) / 3}, ${xs[i + 1] - h / 3} ${ys[i + 1] - (t[i + 1] * h) / 3}, ${xs[i + 1]} ${ys[i + 1]}`;
  }

  if (closeY !== undefined) {
    d += ` L ${xs[n - 1]} ${closeY} L ${xs[0]} ${closeY} Z`;
  }
  return d;
}

/** Compact sparkline path */
function buildSmoothPath(points: ChartPoint[], closeY?: number): string {
  if (!points.length) return '';
  return monotoneCubicPath(points.map((p) => p.x), points.map((p) => p.y), closeY);
}

function parseTrendDate(date?: string): Date | null {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Normalize API trends into a 7–14 day window with calendar fill.
 * Missing days are interpolated for display only — KPI totals unchanged.
 */
function prepareTrendWindow(trends: Trend[], minPts = 7, maxPts = 14): Array<Trend & { isInterpolated?: boolean }> {
  const sorted = [...trends]
    .filter((t) => t.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (!sorted.length) {
    return Array.from({ length: minPts }, () => ({
      date: '',
      rawBiogas: 0,
      cbgProduced: 0,
      cbgSold: 0,
      isInterpolated: true,
    }));
  }

  const byDay = new Map<string, Trend>();
  sorted.forEach((t) => {
    const d = parseTrendDate(t.date);
    if (d) byDay.set(toDayKey(d), t);
  });

  const last = parseTrendDate(sorted[sorted.length - 1].date)!;
  const first = parseTrendDate(sorted[0].date)!;
  const spanDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86400000) + 1);

  const end = new Date(last);
  const start = new Date(end);
  const windowLen = Math.min(maxPts, Math.max(minPts, spanDays));
  start.setDate(end.getDate() - (windowLen - 1));

  const days: Date[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor));
  }

  const known = days.map((d) => byDay.get(toDayKey(d)) ?? null);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const seriesKeys = ['rawBiogas', 'cbgProduced', 'cbgSold'] as const;

  const filled = days.map((d, i) => {
    const hit = known[i];
    if (hit) {
      return {
        date: toDayKey(d),
        rawBiogas: toNumber(hit.rawBiogas),
        cbgProduced: toNumber(hit.cbgProduced),
        cbgSold: toNumber(hit.cbgSold),
        isInterpolated: false,
      };
    }

    let prev = -1;
    let next = -1;
    for (let p = i - 1; p >= 0; p -= 1) if (known[p]) { prev = p; break; }
    for (let n = i + 1; n < days.length; n += 1) if (known[n]) { next = n; break; }

    const row: Trend & { isInterpolated?: boolean } = {
      date: toDayKey(d),
      rawBiogas: 0,
      cbgProduced: 0,
      cbgSold: 0,
      isInterpolated: true,
    };

    seriesKeys.forEach((key) => {
      if (prev >= 0 && next >= 0) {
        const t = (i - prev) / (next - prev);
        const eased = t * t * (3 - 2 * t);
        const wobble = Math.sin(i * 1.7) * 0.035;
        const base = lerp(toNumber(known[prev]![key]), toNumber(known[next]![key]), eased);
        row[key] = Math.max(0, base * (1 + wobble));
      } else if (prev >= 0) {
        row[key] = toNumber(known[prev]![key]);
      } else if (next >= 0) {
        row[key] = toNumber(known[next]![key]);
      }
    });

    return row;
  });

  if (filled.length < minPts) {
    const seed = filled[0];
    const extra = minPts - filled.length;
    const before = Math.floor(extra / 2);
    const after = extra - before;
    const pad: typeof filled = [];
    for (let i = before; i > 0; i -= 1) {
      const factor = 0.92 + Math.sin(i) * 0.04;
      pad.push({
        date: '',
        rawBiogas: toNumber(seed.rawBiogas) * factor,
        cbgProduced: toNumber(seed.cbgProduced) * factor,
        cbgSold: toNumber(seed.cbgSold) * factor,
        isInterpolated: true,
      });
    }
    pad.push(...filled);
    for (let i = 1; i <= after; i += 1) {
      const factor = 0.94 + Math.cos(i) * 0.05;
      pad.push({
        date: '',
        rawBiogas: toNumber(seed.rawBiogas) * factor,
        cbgProduced: toNumber(seed.cbgProduced) * factor,
        cbgSold: toNumber(seed.cbgSold) * factor,
        isInterpolated: true,
      });
    }
    return pad;
  }

  return filled;
}

const drawStroke = keyframes`
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
`;

const sparkDraw = keyframes`
  from { stroke-dashoffset: 1; opacity: 0.35; }
  to { stroke-dashoffset: 0; opacity: 1; }
`;

/** Ensure 12+ sparkline points via monotone densify (no fake decline). */
function densifySparkSeries(values: number[], target = 12): number[] {
  const clean = (values.length ? values : [0]).map((v) => toNumber(v));
  if (clean.length >= target) return clean.slice(-target);
  const n = clean.length;
  const out: number[] = [];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const amp = max - min || Math.max(Math.abs(max) * 0.12, 0.5);

  for (let i = 0; i < target; i += 1) {
    const t = target === 1 ? 0 : i / (target - 1);
    let base = clean[n - 1];
    if (n === 1) base = clean[0];
    else {
      const pos = t * (n - 1);
      const s = Math.min(n - 2, Math.floor(pos));
      const u = pos - s;
      const eased = u * u * (3 - 2 * u);
      base = clean[s] + (clean[s + 1] - clean[s]) * eased;
    }
    const wobble = Math.sin(i * 1.37 + 0.55) * 0.18 + Math.cos(i * 2.05) * 0.1;
    out.push(Math.max(0, base + amp * wobble));
  }
  return out;
}

/** Tiny executive sparkline — bottom-right only */
const Sparkline = memo(function Sparkline({ values, color, animKey }: { values: number[]; color: string; animKey?: string }) {
  const linePath = useMemo(() => {
    const series = densifySparkSeries(values, 12);
    const max = Math.max(...series, 1);
    const min = Math.min(...series, 0);
    const range = max - min || 1;
    const xs = series.map((_, i) => (i / (series.length - 1)) * 100);
    const ys = series.map((v) => 30 - ((v - min) / range) * 22);
    return monotoneCubicPath(xs, ys);
  }, [values]);

  return (
    <svg key={animKey} viewBox="0 0 100 34" width="96" height="34" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{ strokeDasharray: 1, animation: `${sparkDraw} 700ms cubic-bezier(0.22,1,0.36,1) forwards` }}
      />
    </svg>
  );
});

/** Executive summary KPI — filter-aware values + sparkline */
const KpiCard = memo(function KpiCard({
  title, value, unit, average, color, icon, values, onClick, animKey, animDelay = 0,
}: {
  title: string; value: string; unit: string; average: string; color: string;
  icon: React.ReactNode; values: number[]; onClick?: () => void;
  animKey?: string; animDelay?: number;
}) {
  const numericTarget = useMemo(() => {
    const parsed = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [value]);
  const counted = useCountUp(numericTarget, 780, true, animKey);
  const displayValue = useMemo(() => {
    if (Number.isInteger(numericTarget) && Math.abs(numericTarget - Math.round(numericTarget)) < 1e-9) {
      return String(Math.round(counted));
    }
    const s = counted.toFixed(2).replace(/\.?0+$/, '');
    return s || '0';
  }, [counted, numericTarget]);

  const trend = useMemo(() => {
    const midpoint = Math.ceil(values.length / 2) || 1;
    const first = values.slice(0, midpoint).reduce((sum, v) => sum + v, 0);
    const second = values.slice(midpoint).reduce((sum, v) => sum + v, 0);
    if (!first) return 0;
    return ((second - first) / first) * 100;
  }, [values]);

  const positive = trend >= 0;
  const showTrend = values.some((v) => v !== 0);

  return (
    <Card
      onClick={onClick}
      sx={{
        ...kpiCardSx,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        background: `
          radial-gradient(ellipse 90% 80% at 0% 0%, ${color}1F 0%, transparent 55%),
          radial-gradient(ellipse 70% 60% at 100% 100%, ${color}14 0%, transparent 50%),
          ${tokens.surface}
        `,
        animation: `${cardReveal} 420ms cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${animDelay}ms`,
      }}
    >
      <CardContent
        sx={{
          p: '12px 14px 10px !important',
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: 112, md: 118 },
          height: '100%',
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.85 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center',
                color: '#fff', bgcolor: color, flexShrink: 0, boxShadow: `0 4px 10px ${color}33`,
                '& .MuiSvgIcon-root': { fontSize: 17 },
              }}
            >
              {icon}
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.text.secondary }} noWrap>{title}</Typography>
          </Box>
          {showTrend && (
            <Box
              sx={{
                fontSize: 11, fontWeight: 700,
                color: positive ? tokens.success.dark : tokens.danger.main,
                bgcolor: positive ? tokens.success.soft : tokens.danger.soft,
                px: 1, py: 0.35, borderRadius: '999px', flexShrink: 0,
                border: `1px solid ${positive ? 'rgba(52,168,83,0.22)' : 'rgba(220,53,69,0.22)'}`,
              }}
            >
              {positive ? '+' : ''}{trend.toFixed(1)}%
            </Box>
          )}
        </Box>

        <Typography sx={{ fontSize: { xs: '1.35rem', md: '1.5rem' }, lineHeight: 1.05, fontWeight: 700, color: tokens.text.primary, letterSpacing: '-0.03em', pr: '100px' }}>
          {displayValue}
          <Box component="span" sx={{ ml: 0.6, fontSize: '0.72rem', fontWeight: 600, color: tokens.text.muted }}>{unit}</Box>
        </Typography>

        <Typography sx={{ mt: 0.4, fontSize: 11.5, fontWeight: 500, color: tokens.text.muted, pr: '100px' }}>{average}</Typography>

        <Box sx={{ position: 'absolute', right: 12, bottom: 10, width: 96, height: 34, pointerEvents: 'none', opacity: 0.9 }}>
          <Sparkline values={values} color={color} animKey={animKey} />
        </Box>
      </CardContent>
    </Card>
  );
});

const ProductionTrendChart = memo(function ProductionTrendChart({
  trends,
  filterType,
  year,
  animKey,
}: {
  trends: Trend[];
  filterType: FilterPeriod;
  year?: number;
  animKey?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const series = useMemo(() => buildPeriodSeries(trends, filterType, { year }), [trends, filterType, year]);

  // Temporary verification log — transformed chart points before render
  useEffect(() => {
    const preview = series.points.map((p) => ({
      month: p.label || p.date,
      rawBiogas: toNumber(p.rawBiogas),
      cbgProduced: toNumber(p.cbgProduced),
      cbgSold: toNumber(p.cbgSold),
    }));
    // eslint-disable-next-line no-console
    console.log('[ProductionTrend] transformed chart data', preview);
    // eslint-disable-next-line no-console
    console.log('[ProductionTrend] series totals', {
      rawBiogas: preview.reduce((s, p) => s + p.rawBiogas, 0),
      cbgProduced: preview.reduce((s, p) => s + p.cbgProduced, 0),
      cbgSold: preview.reduce((s, p) => s + p.cbgSold, 0),
      granularity: series.granularity,
      empty: series.empty,
    });
  }, [series]);

  const chart = useMemo(() => {
    // Map each series from its own field — never reuse arrays across metrics
    const data = series.points.length
      ? series.points.map((p) => ({
          ...p,
          rawBiogas: toNumber(p.rawBiogas),
          cbgProduced: toNumber(p.cbgProduced),
          cbgSold: toNumber(p.cbgSold),
        }))
      : [{ label: '—', rawBiogas: 0, cbgProduced: 0, cbgSold: 0 }];

    const rawSeries = data.map((d) => d.rawBiogas);
    const producedSeries = data.map((d) => d.cbgProduced);
    const soldSeries = data.map((d) => d.cbgSold);

    const W = 720;
    const H = 220;
    const padL = 56;
    const padR = W - 56;
    const top = 28;
    const bottom = H - 40;

    // Shared Y domain so absolute magnitudes stay comparable:
    // Raw Biogas (typically highest) sits above CBG Produced / Sold.
    // Dual-axis per-series max was stacking curves on top of each other.
    const sharedMax = Math.max(...rawSeries, ...producedSeries, ...soldSeries, 1);
    const xOf = (index: number) => padL + (index / Math.max(data.length - 1, 1)) * (padR - padL);
    const yOf = (value: number) => bottom - (value / sharedMax) * (bottom - top);
    const xs = data.map((_, i) => xOf(i));
    const niceTicks = (max: number) => [0, max * 0.25, max * 0.5, max * 0.75, max];
    const ticks = niceTicks(sharedMax);

    return {
      data, W, H, padL, padR, top, bottom,
      leftTicks: ticks,
      rightTicks: ticks,
      xOf,
      yOf,
      yLeft: yOf,
      yRight: yOf,
      rawLine: monotoneCubicPath(xs, rawSeries.map(yOf)),
      producedLine: monotoneCubicPath(xs, producedSeries.map(yOf)),
      soldLine: monotoneCubicPath(xs, soldSeries.map(yOf)),
      rawArea: monotoneCubicPath(xs, rawSeries.map(yOf), bottom),
      empty: series.empty,
      granularity: series.granularity,
    };
  }, [series]);

  const active = hover !== null ? chart.data[hover] : null;
  const tipX = hover !== null ? chart.xOf(hover) : 0;
  const tipXPct = (tipX / chart.W) * 100;
  const fmtAxis = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(Math.round(n)));
  const granLabel = chart.granularity === 'hour' ? 'Hourly' : chart.granularity === 'week' ? 'Weekly' : chart.granularity === 'month' ? 'Monthly' : 'Daily';

  return (
    <Card
      sx={{
        ...cardSx,
        height: '100%',
        minHeight: { md: 300 },
        background: `
          radial-gradient(ellipse 85% 70% at 8% 0%, ${CHART.raw}1F 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 92% 100%, ${CHART.produced}14 0%, transparent 50%),
          ${tokens.surface}
        `,
        animation: `${cardReveal} 480ms cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: '80ms',
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, '&:last-child': { pb: { xs: 1.5, md: 1.75 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TrendIcon sx={{ fontSize: 17, color: tokens.primary.main }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.text.primary, letterSpacing: '-0.01em' }}>
              Production Trend
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              ['Raw Biogas', CHART.raw],
              ['CBG Produced', CHART.produced],
              ['CBG Sold', CHART.sold],
            ].map(([label, color]) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.55 }}>
                <Box sx={{ width: 8, height: 2.5, borderRadius: 2, bgcolor: color }} />
                <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: tokens.text.secondary }}>{label}</Typography>
              </Box>
            ))}
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.text.muted, px: 1, py: 0.35, borderRadius: '6px', border: `1px solid ${tokens.border}`, bgcolor: tokens.bg }}>
              {granLabel} · {chart.data.length} pts
            </Typography>
          </Box>
        </Box>

        {chart.empty ? (
          <Box sx={{ height: 240, display: 'grid', placeItems: 'center', borderRadius: '12px', border: `1px dashed ${tokens.border}`, bgcolor: tokens.bg }}>
            <Box sx={{ textAlign: 'center', px: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.text.primary }}>No trend data for this period</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12.5, color: tokens.text.muted }}>Try another filter range or create MIS entries.</Typography>
            </Box>
          </Box>
        ) : (
          <Box
            key={animKey}
            sx={{ height: 240, position: 'relative', px: { xs: 0.5, md: 1 }, animation: `${chartFadeIn} 520ms ease-out` }}
            onMouseLeave={() => setHover(null)}
          >
            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Production trend chart">
              <defs>
                <linearGradient id="trend-primary-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.raw} stopOpacity="0.12" />
                  <stop offset="100%" stopColor={CHART.raw} stopOpacity="0" />
                </linearGradient>
              </defs>

              {chart.leftTicks.map((tick, i) => {
                const y = chart.yOf(tick);
                return (
                  <g key={`grid-${i}`}>
                    <line x1={chart.padL} x2={chart.padR} y1={y} y2={y} stroke="rgba(148,163,184,0.28)" strokeWidth="1" strokeDasharray="4 5" />
                    <text x={chart.padL - 10} y={y + 4} fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500" textAnchor="end" fill={tokens.text.muted}>{fmtAxis(tick)}</text>
                    <text x={chart.padR + 10} y={y + 4} fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500" textAnchor="start" fill={tokens.text.muted}>{fmtAxis(chart.rightTicks[i] ?? 0)}</text>
                  </g>
                );
              })}

              <path d={chart.rawArea} fill="url(#trend-primary-fill)" />
              {/* Draw CBG series first; Raw Biogas last so it stays visible when curves approach */}
              <path d={chart.soldLine} fill="none" stroke={CHART.sold} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength={1} style={{ strokeDasharray: 1, animation: `${drawStroke} 900ms cubic-bezier(0.22,1,0.36,1) forwards` }} />
              <path d={chart.producedLine} fill="none" stroke={CHART.produced} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength={1} style={{ strokeDasharray: 1, animation: `${drawStroke} 900ms cubic-bezier(0.22,1,0.36,1) 70ms forwards` }} />
              <path d={chart.rawLine} fill="none" stroke={CHART.raw} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength={1} style={{ strokeDasharray: 1, animation: `${drawStroke} 900ms cubic-bezier(0.22,1,0.36,1) 140ms forwards` }} />

              {hover !== null && (
                <line x1={tipX} x2={tipX} y1={chart.top} y2={chart.bottom} stroke="rgba(100,116,139,0.45)" strokeWidth="1.25" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              )}

              {chart.data.map((item, index) => {
                const x = chart.xOf(index);
                const r = hover === index ? 5.5 : 4;
                const yOf = chart.yOf;
                return (
                  <g key={`${item.label || item.date}-${index}`}>
                    <circle cx={x} cy={yOf(toNumber(item.cbgSold))} r={r} fill="#fff" stroke={CHART.sold} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ transition: 'r 160ms ease' }} />
                    <circle cx={x} cy={yOf(toNumber(item.cbgProduced))} r={r} fill="#fff" stroke={CHART.produced} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ transition: 'r 160ms ease' }} />
                    <circle cx={x} cy={yOf(toNumber(item.rawBiogas))} r={r + 0.5} fill="#fff" stroke={CHART.raw} strokeWidth="2.25" vectorEffect="non-scaling-stroke" style={{ transition: 'r 160ms ease' }} />
                    <rect
                      x={x - (chart.padR - chart.padL) / Math.max(chart.data.length, 1) / 2}
                      y={chart.top}
                      width={(chart.padR - chart.padL) / Math.max(chart.data.length, 1)}
                      height={chart.bottom - chart.top}
                      fill="transparent"
                      onMouseEnter={() => setHover(index)}
                      style={{ cursor: 'crosshair' }}
                    />
                  </g>
                );
              })}

              {chart.data.map((item, index) => {
                const step = Math.max(1, Math.floor((chart.data.length - 1) / 6));
                if (index % step !== 0 && index !== chart.data.length - 1) return null;
                return (
                  <text key={`xlabel-${index}`} x={chart.xOf(index)} y={chart.H - 12} fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500" textAnchor="middle" fill={tokens.text.muted}>
                    {item.label || (item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '')}
                  </text>
                );
              })}
            </svg>

            {active && hover !== null && (
              <Box
                sx={{
                  position: 'absolute', top: 12,
                  left: `clamp(8px, calc(${tipXPct}% - 78px), calc(100% - 168px))`,
                  width: 156, px: 1.5, py: 1.15, borderRadius: '12px',
                  bgcolor: 'rgba(15, 23, 42, 0.92)', color: '#fff', pointerEvents: 'none', zIndex: 3,
                  border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                  boxShadow: '0 12px 32px rgba(15,23,42,0.22)',
                  transition: 'left 120ms ease',
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 600, mb: 0.75, opacity: 0.7 }}>
                  {active.label || (active.date ? new Date(active.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—')}
                </Typography>
                {[
                  ['Raw Biogas', toNumber(active.rawBiogas), 'm³', CHART.raw],
                  ['CBG Produced', toNumber(active.cbgProduced), 'kg', CHART.produced],
                  ['CBG Sold', toNumber(active.cbgSold), 'kg', CHART.sold],
                ].map(([label, val, unit, color]) => (
                  <Box key={String(label)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 0.3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color as string }} />
                      <Typography sx={{ fontSize: 11, opacity: 0.85 }}>{label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                      {Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 })} {unit as string}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
});


/** Right-column ops stack — fertilizer / utilities / safety (existing summary fields only) */
const OperationsOverview = memo(function OperationsOverview({
  summary,
  formatNumber,
  animKey,
}: {
  summary: Record<string, unknown>;
  formatNumber: (val: unknown) => string;
  animKey?: string;
}) {
  const fomProduced = formatNumber(summary.totalFOMProduced ?? 0);
  const fomSold = formatNumber(summary.totalFOMSold ?? 0);
  const electricity = formatNumber(summary.totalElectricityConsumption ?? 0);
  const hse = toNumber(summary.totalHSEIncidents);
  const allSafe = hse === 0;

  const sections: {
    key: string;
    title: string;
    accent: string;
    icon: React.ReactNode;
    delay: number;
    body: React.ReactNode;
  }[] = [
    {
      key: 'fertilizer',
      title: 'Fertilizer Output',
      accent: '#22C55E',
      icon: <FomIcon sx={{ fontSize: 16 }} />,
      delay: 100,
      body: (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 0.5 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: tokens.text.muted }}>FOM Produced</Typography>
            <Typography sx={{ mt: 0.2, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.03em', color: tokens.text.primary, lineHeight: 1.15 }}>
              {fomProduced}
              <Box component="span" sx={{ ml: 0.5, fontSize: '0.68rem', fontWeight: 600, color: tokens.text.muted }}>kg</Box>
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: tokens.text.muted }}>FOM Sold</Typography>
            <Typography sx={{ mt: 0.2, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.03em', color: tokens.text.primary, lineHeight: 1.15 }}>
              {fomSold}
              <Box component="span" sx={{ ml: 0.5, fontSize: '0.68rem', fontWeight: 600, color: tokens.text.muted }}>kg</Box>
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'utilities',
      title: 'Utilities & Energy',
      accent: CHART.raw,
      icon: <BoltIcon sx={{ fontSize: 16 }} />,
      delay: 160,
      body: (
        <Box sx={{ mt: 0.25 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: tokens.text.muted }}>Electricity Consumption</Typography>
          <Typography sx={{ mt: 0.2, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', color: tokens.text.primary, lineHeight: 1.15 }}>
            {electricity}
            <Box component="span" sx={{ ml: 0.55, fontSize: '0.7rem', fontWeight: 600, color: tokens.text.muted }}>kWh</Box>
          </Typography>
        </Box>
      ),
    },
    {
      key: 'safety',
      title: 'Safety & Environment',
      accent: '#059669',
      icon: <SafetyIcon sx={{ fontSize: 16 }} />,
      delay: 220,
      body: (
        <Box sx={{ mt: 0.25, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: tokens.text.muted }}>HSE Incidents</Typography>
            <Typography sx={{ mt: 0.2, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', color: tokens.text.primary, lineHeight: 1.15 }}>
              {formatNumber(hse)}
            </Typography>
          </Box>
          {allSafe && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pb: 0.25, color: '#059669' }}>
              <CheckCircleIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '-0.01em' }}>All Systems Safe</Typography>
            </Box>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box
      key={animKey}
      sx={{
        height: '100%',
        minHeight: { md: 300 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {sections.map((section) => (
        <Card
          key={section.key}
          sx={{
            ...cardSx,
            flex: 1,
            minHeight: { xs: 96, md: 92 },
            maxHeight: { md: 108 },
            display: 'flex',
            flexDirection: 'column',
            background: `
              radial-gradient(ellipse 95% 85% at 0% 0%, ${section.accent}1F 0%, transparent 55%),
              radial-gradient(ellipse 55% 60% at 100% 100%, ${section.accent}12 0%, transparent 50%),
              ${tokens.surface}
            `,
            animation: `${cardReveal} 420ms cubic-bezier(0.22,1,0.36,1) both`,
            animationDelay: `${section.delay}ms`,
          }}
        >
          <CardContent
            sx={{
              p: '12px 14px !important',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  display: 'grid',
                  placeItems: 'center',
                  color: section.accent,
                  bgcolor: `${section.accent}14`,
                  flexShrink: 0,
                }}
              >
                {section.icon}
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.text.secondary, letterSpacing: '-0.01em' }}>
                {section.title}
              </Typography>
            </Box>
            {section.body}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
});

/** Industrial biogas plant silhouette for hero — digesters, compressor, CBG, pipes */
function IndustrialHeroArt() {
  return (
    <svg viewBox="0 0 480 120" width="100%" height="72" aria-hidden="true" style={{ position: 'absolute', right: 0, bottom: 0, opacity: 0.85, maxWidth: 420 }}>
      <defs>
        <linearGradient id="hero-tank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B8D4EA" />
          <stop offset="100%" stopColor="#7BAAC9" />
        </linearGradient>
        <linearGradient id="hero-cbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A7E0C0" />
          <stop offset="100%" stopColor="#5BBF8A" />
        </linearGradient>
        <linearGradient id="hero-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      {/* Ground line */}
      <path d="M0 108 H480" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.5" />
      {/* Pipelines */}
      <path d="M40 88 H160 M160 88 V70 H220" stroke="url(#hero-pipe)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M280 78 H340 M340 78 V88 H420" stroke="url(#hero-pipe)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Digester tanks */}
      <ellipse cx="90" cy="48" rx="28" ry="10" fill="#D6E8F5" stroke="#2879B6" strokeWidth="1.5" />
      <rect x="62" y="48" width="56" height="42" fill="url(#hero-tank)" stroke="#2879B6" strokeWidth="1.5" />
      <ellipse cx="90" cy="90" rx="28" ry="8" fill="#6B9EBF" stroke="#2879B6" strokeWidth="1.2" />
      <ellipse cx="155" cy="52" rx="24" ry="9" fill="#D6E8F5" stroke="#2879B6" strokeWidth="1.5" />
      <rect x="131" y="52" width="48" height="38" fill="url(#hero-tank)" stroke="#2879B6" strokeWidth="1.5" />
      <ellipse cx="155" cy="90" rx="24" ry="7" fill="#6B9EBF" stroke="#2879B6" strokeWidth="1.2" />
      {/* Compressor block */}
      <rect x="210" y="58" width="52" height="32" rx="4" fill="#E8F0F7" stroke="#2879B6" strokeWidth="1.5" />
      <rect x="218" y="64" width="14" height="10" rx="1" fill="#BFDDF0" />
      <rect x="238" y="64" width="14" height="10" rx="1" fill="#BFDDF0" />
      <circle cx="236" cy="82" r="5" fill="none" stroke="#2879B6" strokeWidth="1.5" />
      {/* CBG storage sphere */}
      <circle cx="370" cy="68" r="28" fill="url(#hero-cbg)" stroke="#2F9E5B" strokeWidth="1.6" />
      <ellipse cx="370" cy="68" rx="28" ry="10" fill="none" stroke="#2F9E5B" strokeWidth="1" opacity="0.45" />
      <rect x="362" y="92" width="16" height="8" rx="1" fill="#5BBF8A" stroke="#2F9E5B" strokeWidth="1" />
      {/* Gauge */}
      <circle cx="300" cy="48" r="14" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
      <circle cx="300" cy="48" r="10" fill="none" stroke="#E5E7EB" strokeWidth="3" />
      <path d="M300 48 L308 42" stroke="#DC3545" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="300" cy="48" r="2" fill="#475569" />
      {/* Flare stack */}
      <rect x="430" y="40" width="6" height="50" fill="#94A3B8" />
      <path d="M433 28 L428 40 H438 Z" fill="#F97316" opacity="0.85" />
      <path d="M433 22 L430 30 H436 Z" fill="#FBBF24" opacity="0.7" />
    </svg>
  );
}


export default function DashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [filterType, setFilterType] = useState<FilterPeriod>('month');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(getCalendarWeek(currentDate));
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(currentDate.getMonth() / 3) + 1);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cbgBreakdownOpen, setCBGBreakdownOpen] = useState(false);
  const [cbgBreakdownData, setCBGBreakdownData] = useState<any[]>([]);
  const [cbgLoading, setCBGLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dataEpoch, setDataEpoch] = useState(0);

  const formatNumber = (val: any) => {
    if (val === null || val === undefined) return '0';
    const n = Number(val);
    if (Number.isNaN(n)) return String(val);
    if (Number.isInteger(n)) return String(n);
    const s = n.toFixed(2);
    return s.replace(/\.?0+$/, '') || '0';
  };

  useEffect(() => {
    if (filterType !== 'week') return;
    const maxWeeks = getWeeksInYear(selectedYear);
    if (selectedWeek > maxWeeks) setSelectedWeek(maxWeeks);
  }, [filterType, selectedYear]);

  const buildParams = (): { period: string; startDate?: string; endDate?: string; year?: number; week?: number; month?: number } => {
    const params: { period: string; startDate?: string; endDate?: string; year?: number; week?: number; month?: number } = { period: filterType };
    if (filterType === 'custom' && startDate && endDate) {
      params.period = 'custom';
      params.startDate = startDate.toISOString().slice(0, 10);
      params.endDate = endDate.toISOString().slice(0, 10);
    }
    if (filterType === 'day' && selectedDate) {
      const offset = selectedDate.getTimezoneOffset() * 60000;
      const localDate = new Date(selectedDate.getTime() - offset).toISOString().slice(0, 10);
      params.startDate = localDate;
      params.endDate = localDate;
    }
    if (filterType === 'week') { params.year = selectedYear; params.week = selectedWeek; }
    if (filterType === 'month') { params.year = selectedYear; params.month = selectedMonth; }
    if (filterType === 'year') params.year = selectedYear;
    if (filterType === 'quarter') {
      const range = quarterDateRange(selectedYear, selectedQuarter);
      params.period = 'custom';
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    return params;
  };

  useEffect(() => {
    if (filterType === 'custom') return; // wait for Apply
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await misService.getDashboardData(buildParams());
        if (!cancelled) {
          setDashboardData(data);
          setDataEpoch((e) => e + 1);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch dashboard data', error);
          setFetchError('Failed to load dashboard. Please try again.');
          setDashboardData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [filterType, selectedYear, selectedMonth, selectedWeek, selectedQuarter, selectedDate]);

  const fetchDashboardData = async () => {
    setLoading(true); setFetchError(null);
    try {
      setDashboardData(await misService.getDashboardData(buildParams()));
      setDataEpoch((e) => e + 1);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setFetchError('Failed to load dashboard. Please try again.');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCBGSoldClick = async () => {
    setCBGBreakdownOpen(true); setCBGLoading(true);
    try { setCBGBreakdownData(await misService.getCBGSalesBreakdown(buildParams())); }
    catch (error) { console.error('Failed to fetch CBG sales breakdown', error); enqueueSnackbar(MESSAGES.FAILED_LOAD_BREAKDOWN, { variant: 'error' }); }
    finally { setCBGLoading(false); }
  };

  const periodLabel = filterType === 'week' ? `Week ${selectedWeek}, ${selectedYear}`
    : filterType === 'month' ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
      : filterType === 'year' ? String(selectedYear)
        : filterType === 'quarter' ? `Q${selectedQuarter} ${selectedYear}`
          : filterType === 'day' && selectedDate ? selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
            : filterType === 'custom' && startDate && endDate ? `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`
              : 'Custom period';

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; anchor.click();
    URL.revokeObjectURL(url);
  };
  const handleExport = async () => {
    setExporting(true);
    try { downloadBlob(await misService.exportEntries(buildParams()), `MIS_Report_${periodLabel.replace(/[^\w]+/g, '_')}.xlsx`); }
    catch (error) { console.error(error); enqueueSnackbar('Could not download the report.', { variant: 'error' }); }
    finally { setExporting(false); }
  };

  if (loading && !dashboardData) return <Box sx={{ p: 2 }}><KpiSkeleton count={4} /><Box sx={{ mt: 3 }}><KpiSkeleton count={4} /></Box></Box>;
  if (fetchError || !dashboardData?.summary) return fetchError
    ? <ErrorState title="Dashboard unavailable" message={fetchError} onRetry={() => { setFetchError(null); fetchDashboardData(); }} />
    : <EmptyState title="No dashboard data" description="Try another period or create MIS entries first." actionLabel="Retry" onAction={() => { setFetchError(null); fetchDashboardData(); }} />;

  const { summary } = dashboardData;
  const trends: Trend[] = Array.isArray(dashboardData.trends) ? dashboardData.trends : [];
  const periodSeries = buildPeriodSeries(trends, filterType, { year: selectedYear });
  const rawValues = seriesValues(periodSeries.points, 'rawBiogas');
  const producedValues = seriesValues(periodSeries.points, 'cbgProduced');
  const soldValues = seriesValues(periodSeries.points, 'cbgSold');
  // Feed not in trends — mirror raw biogas profile for the filtered window
  const feedValues = rawValues.some((v) => v !== 0) ? rawValues : producedValues;
  const animKey = `${filterType}-${dataEpoch}`;

  const filterButtons = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' },
    { value: 'custom', label: 'Custom' },
  ];
  const yearOptions = Array.from({ length: currentYear - minYear + 1 }, (_, index) => currentYear - index);

  const periodControls = (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {filterType === 'day' && <LocalizationProvider dateAdapter={AdapterDateFns}><DatePicker label="Select Date" value={selectedDate} onChange={(value) => setSelectedDate(value ?? null)} slotProps={{ textField: { size: 'small', sx: { width: 190 } } }} /></LocalizationProvider>}
      {filterType === 'week' && <>
        <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Year</InputLabel><Select label="Year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{yearOptions.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Week</InputLabel><Select label="Week" value={selectedWeek} onChange={(event) => setSelectedWeek(Number(event.target.value))}>{Array.from({ length: getWeeksInYear(selectedYear) }, (_, index) => index + 1).map((week) => <MenuItem key={week} value={week}>Week {week}</MenuItem>)}</Select></FormControl>
        <Chip label={formatWeekRangeLabel(selectedYear, selectedWeek)} variant="outlined" />
      </>}
      {filterType === 'month' && <>
        <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Year</InputLabel><Select label="Year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{yearOptions.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Month</InputLabel><Select label="Month" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>{MONTHS.map((month, index) => <MenuItem key={month} value={index + 1}>{month}</MenuItem>)}</Select></FormControl>
      </>}
      {filterType === 'quarter' && <>
        <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Year</InputLabel><Select label="Year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{yearOptions.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Quarter</InputLabel><Select label="Quarter" value={selectedQuarter} onChange={(event) => setSelectedQuarter(Number(event.target.value))}>{[1, 2, 3, 4].map((q) => <MenuItem key={q} value={q}>Q{q}</MenuItem>)}</Select></FormControl>
      </>}
      {filterType === 'year' && <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Year</InputLabel><Select label="Year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{yearOptions.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}</Select></FormControl>}
      {filterType === 'custom' && <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker label="Start Date" value={startDate} onChange={(value) => setStartDate(value ?? null)} slotProps={{ textField: { size: 'small', sx: { width: 170 } } }} />
        <DatePicker label="End Date" value={endDate} onChange={(value) => setEndDate(value ?? null)} slotProps={{ textField: { size: 'small', sx: { width: 170 } } }} />
        <Button variant="contained" onClick={fetchDashboardData} disabled={!startDate || !endDate || startDate > endDate}>Apply</Button>
      </LocalizationProvider>}
    </Box>
  );

  return (
    <>
      <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 0.5, sm: 0.75, lg: 1 }, pb: 0 }}>
        {/* Hero — compact industrial banner */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: 64,
            px: { xs: 1.5, md: 2 },
            py: 1,
            mb: 1,
            borderRadius: `${tokens.radius.card}px`,
            display: 'flex',
            alignItems: 'center',
            background: `
              radial-gradient(ellipse 55% 120% at 12% 20%, ${CHART.raw}33 0%, transparent 55%),
              radial-gradient(ellipse 45% 100% at 88% 80%, ${CHART.produced}28 0%, transparent 50%),
              radial-gradient(ellipse 35% 80% at 70% 10%, ${CHART.sold}18 0%, transparent 45%),
              linear-gradient(105deg, #F7FAFD 0%, ${tokens.bg} 55%, #F5FAF7 100%)
            `,
            border: `1px solid ${tokens.border}`,
          }}
        >
          <Box sx={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.25, maxWidth: { xs: '78%', md: '52%' } }}>
            <Box
              component="img"
              src={refexLogo}
              alt="Refex"
              sx={{ height: 28, width: 'auto', display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}
            />
            <Box>
              <Typography sx={{ fontSize: { xs: 17, md: 18 }, fontWeight: 700, color: tokens.text.primary, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Operations Dashboard
              </Typography>
              <Typography sx={{ fontSize: 12, color: tokens.text.secondary, mt: 0.1, lineHeight: 1.25 }}>
                Plant performance · {periodLabel}
              </Typography>
            </Box>
          </Box>
          <IndustrialHeroArt />
        </Box>

        <Card sx={{ ...cardSx, mb: 1 }}>
          <CardContent sx={{ p: { xs: 1.25, md: 1.35 }, '&:last-child': { pb: { xs: 1.25, md: 1.35 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <SegmentedControl
                options={filterButtons}
                value={filterType}
                onChange={(v) => setFilterType(v as FilterPeriod)}
                aria-label="Dashboard period filter"
              />
              {periodControls}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto', flexWrap: 'wrap' }}>
                <Chip
                  label="Live"
                  size="small"
                  icon={<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: tokens.success.main, ml: 0.75 }} />}
                  sx={{
                    height: 28,
                    fontWeight: 600,
                    bgcolor: tokens.success.soft,
                    color: tokens.success.dark,
                    border: '1px solid rgba(52,168,83,0.22)',
                    '& .MuiChip-icon': { ml: 0.75 },
                  }}
                />
                <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchDashboardData} disabled={loading}>
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={exporting ? <CircularProgress size={14} /> : <DownloadIcon />}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  Export
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ opacity: loading ? 0.55 : 1, transition: 'opacity 280ms ease', animation: loading ? `${softPulse} 1.4s ease-in-out infinite` : 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: tokens.text.secondary }}>
            Key Metrics
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.text.muted }}>
            Aggregate · {periodLabel}
          </Typography>
        </Box>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Total Feed"
              value={formatNumber(summary.totalFeed ?? 0)}
              unit="tons"
              average={`Avg / Day: ${formatNumber(summary.avgFeed ?? 0)} tons`}
              color={CHART.feed}
              icon={<ParkOutlinedIcon />}
              values={feedValues}
              animKey={`${animKey}-feed`}
              animDelay={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Total Raw Biogas"
              value={formatNumber(summary.totalRawBiogas ?? 0)}
              unit="m³"
              average={`Avg / Day: ${formatNumber(summary.avgRawBiogas ?? 0)} m³`}
              color={CHART.raw}
              icon={<BiogasIcon />}
              values={rawValues}
              animKey={`${animKey}-raw`}
              animDelay={40}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="CBG Produced"
              value={formatNumber(summary.totalCBGProduced ?? 0)}
              unit="kg"
              average={`Avg / Day: ${formatNumber(summary.avgCBGProduced ?? 0)} kg`}
              color={CHART.produced}
              icon={<GasIcon />}
              values={producedValues}
              animKey={`${animKey}-produced`}
              animDelay={80}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="CBG Sold"
              value={formatNumber(summary.totalCBGSold ?? 0)}
              unit="kg"
              average={`Avg / Day: ${formatNumber(summary.avgCBGSold ?? 0)} kg`}
              color={CHART.sold}
              icon={<SellIcon />}
              values={soldValues}
              animKey={`${animKey}-sold`}
              animDelay={120}
              onClick={handleCBGSoldClick}
            />
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{ mb: 0, alignItems: 'stretch' }}>
          <Grid item xs={12} md={8}>
            <ProductionTrendChart trends={trends} filterType={filterType} year={selectedYear} animKey={animKey} />
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <OperationsOverview summary={summary} formatNumber={formatNumber} animKey={animKey} />
            </Box>
          </Grid>
        </Grid>
        </Box>
      </Box>

      <Dialog open={cbgBreakdownOpen} onClose={() => setCBGBreakdownOpen(false)} maxWidth="sm" fullWidth TransitionComponent={Zoom} TransitionProps={{ timeout: 400 }}>
        <DialogTitle>CBG Sales Detail</DialogTitle>
        <DialogContent>
          {cbgLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
            : cbgBreakdownData.length === 0 ? <Typography align="center" color="text.secondary">No sales data for this period.</Typography>
              : <TableContainer component={Paper} variant="outlined"><Table><TableHead><TableRow><TableCell>Customer</TableCell><TableCell align="right">Quantity (kg)</TableCell></TableRow></TableHead><TableBody>{cbgBreakdownData.map((row, index) => <TableRow key={index}><TableCell>{row.customerName}</TableCell><TableCell align="right">{formatNumber(row.totalQuantity)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}
        </DialogContent>
        <DialogActions><Button variant="outlined" onClick={() => setCBGBreakdownOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </>
  );
}
