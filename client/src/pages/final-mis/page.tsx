
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { tokens } from '../../themes';
import { PageHeader, FilterToolbar, SegmentedControl, filterActionSx } from '../../components/ui/PageChrome';
import { AppDateField } from '../../components/ui/AppDateField';
import type { MISEntry } from '../../mocks/misEntries';
import { misService } from '../../services/misService';

type FilterType = 'single' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

function capitalizeStatus(s: string): string {
  if (!s) return 'Draft';
  const v = String(s).toLowerCase();
  if (v === 'approved') return 'Approved';
  if (v === 'submitted' || v === 'under_review') return 'Submitted';
  if (v === 'rejected') return 'Rejected';
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function mapApiEntryToMISEntry(api: any): MISEntry {
  const dateStr = api.date ? (typeof api.date === 'string' ? api.date : api.date.split('T')[0]) : '';
  return {
    id: String(api.id),
    date: dateStr,
    status: capitalizeStatus(api.status) as MISEntry['status'],
    createdBy: api.createdBy || 'Unknown',
    createdAt: api.created_at || api.createdAt || '',
    updatedAt: api.updated_at || api.updatedAt || '',
    rawMaterials: api.rawMaterials ?? {
      cowDungPurchased: 0, cowDungStock: 0, oldPressMudOpeningBalance: 0, oldPressMudPurchased: 0,
      oldPressMudDegradationLoss: 0, oldPressMudClosingStock: 0, newPressMudPurchased: 0, pressMudUsed: 0,
      totalPressMudStock: 0, auditNote: '',
    },
    feedMixingTank: api.feedMixingTank ?? {
      cowDungFeed: { qty: 0, ts: 0, vs: 0 },
      pressmudFeed: { qty: 0, ts: 0, vs: 0 },
      permeateFeed: { qty: 0, ts: 0, vs: 0 },
      waterQty: 0,
      waterTs: 0,
      waterVs: 0,
      pulpFeed: { qty: 0, ts: 0, vs: 0 },
      maggieFeed: { qty: 0, ts: 0, vs: 0 },
      otherFeedSubstrate: { qty: 0, ts: 0, vs: 0 },
      slurry: { total: 0, ts: 0, vs: 0, ph: 0 },
    },
    digesters: Array.isArray(api.digesters) ? api.digesters : [],
    slsMachine: api.slsMachine ?? { waterConsumption: 0, polyElectrolyte: 0, solution: 0, slurryFeed: 0, wetCakeProduction: 0, wetCakeTs: 0, wetCakeVs: 0, liquidProduced: 0, liquidTs: 0, liquidVs: 0, liquidSentToLagoon: 0 },
    rawBiogas: api.rawBiogas ?? { digester01Gas: 0, digester02Gas: 0, digester03Gas: 0, totalRawBiogas: 0, rbgFlared: 0, gasYield: 0 },
    rawBiogasQuality: api.rawBiogasQuality ?? { ch4: 0, co2: 0, h2s: 0, o2: 0, n2: 0 },
    compressedBiogas: api.compressedBiogas ?? { produced: 0, ch4: 0, co2: 0, h2s: 0, o2: 0, n2: 0, conversionRatio: 0, ch4Slippage: 0, cbgStock: 0, cbgSold: 0 },
    compressors: api.compressors ?? { compressor1Hours: 0, compressor2Hours: 0, totalHours: 0 },
    fertilizer: api.fertilizer ?? { fomProduced: 0, inventory: 0, sold: 0, weightedAverage: 0, revenue1: 0, lagoonLiquidSold: 0, revenue2: 0, looseFomSold: 0, revenue3: 0 },
    utilities: api.utilities ?? { electricityConsumption: 0, specificPowerConsumption: 0 },
    manpower: api.manpower ?? { refexSrelStaff: 0, thirdPartyStaff: 0 },
    plantAvailability: api.plantAvailability ?? { workingHours: 0, scheduledDowntime: 0, unscheduledDowntime: 0, totalAvailability: 0 },
    hse: api.hse ?? { safetyLti: 0, nearMisses: 0, firstAid: 0, reportableIncidents: 0, mti: 0, otherIncidents: 0, fatalities: 0 },
    remarks: api.remarks ?? '',
  };
}

function getDateRangeForFilter(
  filterType: FilterType,
  singleDate: string,
  startDate: string,
  endDate: string,
  selectedMonth: string,
  selectedQuarter: string,
  selectedYear: string
): { startDate: string; endDate: string } {
  switch (filterType) {
    case 'single':
      return { startDate: singleDate, endDate: singleDate };
    case 'week': {
      const end = new Date(singleDate);
      const start = new Date(singleDate);
      start.setDate(start.getDate() - 6);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      };
    }
    case 'month': {
      const [y, m] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      return { startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-${String(lastDay).padStart(2, '0')}` };
    }
    case 'quarter': {
      const y = selectedYear;
      // Financial year quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
      const [qStart, qEnd] = selectedQuarter === 'Q1' ? [4, 6] : selectedQuarter === 'Q2' ? [7, 9] : selectedQuarter === 'Q3' ? [10, 12] : [1, 3];
      return { startDate: `${y}-${String(qStart).padStart(2, '0')}-01`, endDate: `${y}-${String(qEnd).padStart(2, '0')}-${String(new Date(Number(y), qEnd, 0).getDate()).padStart(2, '0')}` };
    }
    case 'year':
      return { startDate: `${selectedYear}-01-01`, endDate: `${selectedYear}-12-31` };
    case 'custom':
      return { startDate, endDate };
    default:
      return { startDate, endDate };
  }
}

type FeedRowData = { d01: number; d02: number; d03: number; total: number };
type FeedQualityData = { ts: number | null; vs: number | null; ph: number | null };

/** Single-digester plant: all feed assigned to Digester; unused columns stay 0 for report layout. */
function splitFeedTotals(totalQty: number): FeedRowData {
  const total = Number(totalQty || 0);
  return { d01: total, d02: 0, d03: 0, total };
}

function maybeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMaybeFixed(value: number | null | undefined, digits: number): string {
  const parsed = maybeNumber(value);
  return parsed === null ? '-' : parsed.toFixed(digits);
}

const FinalMISPage = () => {
  const theme = useTheme();
  const isPhone = useMediaQuery('(max-width:768px)');
  const [filterType, setFilterType] = useState<FilterType>('single');
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [entries, setEntries] = useState<MISEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);


  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { startDate: s, endDate: e } = getDateRangeForFilter(filterType, singleDate, startDate, endDate, selectedMonth, selectedQuarter, selectedYear);
      const data = await misService.getEntriesForReport({ startDate: s, endDate: e });
      const list = Array.isArray(data) ? data.map(mapApiEntryToMISEntry) : [];
      setEntries(list);
    } catch (err: any) {
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load report data');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, singleDate, startDate, endDate, selectedMonth, selectedQuarter, selectedYear]);

  // Initial load with default month; refetch when filter or period changes (except custom: use Apply)
  useEffect(() => {
    if (filterType !== 'custom') loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, singleDate, selectedMonth, selectedQuarter, selectedYear]);

  // Filter entries based on selected filter type (client-side filter of loaded range)
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);

      switch (filterType) {
        case 'single':
          return entry.date === singleDate;
        case 'week': {
          const { startDate: s, endDate: e } = getDateRangeForFilter(filterType, singleDate, startDate, endDate, selectedMonth, selectedQuarter, selectedYear);
          return entry.date >= s && entry.date <= e;
        }
        case 'month':
          return entry.date.startsWith(selectedMonth);
        case 'quarter': {
          const month = entryDate.getMonth();
          const year = entryDate.getFullYear().toString();
          if (year !== selectedYear) return false;
          // Financial year quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
          if (selectedQuarter === 'Q1') return month >= 3 && month <= 5;  // Apr-Jun (months 3-5)
          if (selectedQuarter === 'Q2') return month >= 6 && month <= 8;  // Jul-Sep (months 6-8)
          if (selectedQuarter === 'Q3') return month >= 9 && month <= 11; // Oct-Dec (months 9-11)
          if (selectedQuarter === 'Q4') return month >= 0 && month <= 2;  // Jan-Mar (months 0-2)
          return false;
        }
        case 'year':
          return entryDate.getFullYear().toString() === selectedYear;
        case 'custom':
          return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        default:
          return true;
      }
    });
  }, [
    entries,
    filterType,
    singleDate,
    startDate,
    endDate,
    selectedMonth,
    selectedQuarter,
    selectedYear,
  ]);

  // Aggregate data from filtered entries
  const aggregatedData = useMemo(() => {
    if (filteredEntries.length === 0) {
      return null;
    }

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => (arr.length > 0 ? sum(arr) / arr.length : 0);
    const averagePresent = (values: Array<number | null>) => {
      const valid = values.filter((value): value is number => value !== null);
      return valid.length > 0 ? sum(valid) / valid.length : null;
    };
    const buildFeedTotals = (getQty: (entry: MISEntry) => unknown) =>
      splitFeedTotals(sum(filteredEntries.map((entry) => Number(getQty(entry) || 0))));
    const buildQuality = (
      getTs: (entry: MISEntry) => unknown,
      getVs: (entry: MISEntry) => unknown,
      getPh?: (entry: MISEntry) => unknown
    ): FeedQualityData => ({
      ts: averagePresent(filteredEntries.map((entry) => maybeNumber(getTs(entry)))),
      vs: averagePresent(filteredEntries.map((entry) => maybeNumber(getVs(entry)))),
      ph: getPh ? averagePresent(filteredEntries.map((entry) => maybeNumber(getPh(entry)))) : null,
    });

    // Single digester plant — D-01 holds values; D-02/D-03 unused (kept for report column layout)
    const d01Feed = sum(
      filteredEntries.map((e) => e.digesters[0]?.feeding.totalSlurryFeed || 0)
    );
    const d01Discharge = sum(
      filteredEntries.map((e) => e.digesters[0]?.discharge?.totalSlurryOut || 0)
    );
    const totalFeedInputFromForm = sum(
      filteredEntries.map(
        (e) =>
          (Number(e.feedMixingTank?.cowDungFeed?.qty) || 0) +
          (Number(e.feedMixingTank?.pressmudFeed?.qty) || 0) +
          (Number(e.feedMixingTank?.permeateFeed?.qty) || 0) +
          (Number(e.feedMixingTank?.waterQty) || 0) +
          (Number(e.feedMixingTank?.pulpFeed?.qty) || 0) +
          (Number(e.feedMixingTank?.maggieFeed?.qty) || 0) +
          (Number(e.feedMixingTank?.otherFeedSubstrate?.qty) || 0)
      )
    );
    const totalFeedInputFromMixingTank = sum(
      filteredEntries.map((e) => Number(e.feedMixingTank?.slurry?.total) || 0)
    );
    const totalFeedInputFromDigesters = {
      d01: d01Feed,
      d02: 0,
      d03: 0,
      total: d01Feed,
    };
    const totalFeedInput =
      totalFeedInputFromForm > 0
        ? splitFeedTotals(totalFeedInputFromForm)
        : totalFeedInputFromMixingTank > 0
        ? splitFeedTotals(totalFeedInputFromMixingTank)
        : totalFeedInputFromDigesters;

    const emptyDigesterPerf = { ts: 0, vs: 0, ph: 0, vfaTic: 0, slurryLevel: 0, hrt: 0, olr: 0, temp: 0 };
    const d01Perf = {
      ts: avg(filteredEntries.map((e) => e.digesters[0]?.feeding.avgTs || 0)),
      vs: avg(filteredEntries.map((e) => e.digesters[0]?.feeding.avgVs || 0)),
      ph: avg(filteredEntries.map((e) => e.digesters[0]?.characteristics.ph || 0)),
      vfaTic: avg(filteredEntries.map((e) => e.digesters[0]?.characteristics.vfaAlkRatio || 0)),
      slurryLevel: avg(filteredEntries.map((e) => e.digesters[0]?.characteristics.slurryLevel || 0)),
      hrt: avg(filteredEntries.map((e) => e.digesters[0]?.health?.hrt || 0)),
      olr: avg(filteredEntries.map((e) => e.digesters[0]?.health?.olr || 0)),
      temp: avg(filteredEntries.map((e) => e.digesters[0]?.characteristics.temperature || 0)),
    };

    return {
      recordCount: filteredEntries.length,
      dateRange:
        filterType === 'single'
          ? singleDate
          : filterType === 'custom' || filterType === 'week'
            ? `${startDate} to ${endDate}`
            : filterType === 'month'
              ? selectedMonth
              : filterType === 'quarter'
                ? `${selectedQuarter} ${selectedYear}`
                : selectedYear,
      feeding: {
        pressMud: buildFeedTotals((e) => e.feedMixingTank.pressmudFeed.qty),
        cowDung: buildFeedTotals((e) => e.feedMixingTank.cowDungFeed.qty),
        decanterPermeate: buildFeedTotals((e) => e.feedMixingTank.permeateFeed.qty),
        water: buildFeedTotals((e) => e.feedMixingTank.waterQty),
        pulp: buildFeedTotals((e) => e.feedMixingTank.pulpFeed?.qty),
        maggie: buildFeedTotals((e) => e.feedMixingTank.maggieFeed?.qty),
        otherFeedSubstrate: buildFeedTotals((e) => e.feedMixingTank.otherFeedSubstrate?.qty),
        digester03Slurry: {
          d01: d01Discharge,
          d02: 0,
          d03: 0,
          total: d01Discharge,
        },
        totalFeedInput,
        // For summary card: same as dashboard "Total Feed Amount" — sum of cow dung + pressmud + permeate + water (tons)
        totalFeedInputFromMixingTank,
        totalFeedAmountTons: totalFeedInputFromForm,
      },
      rawMaterialQuality: {
        pressMud: buildQuality(
          (e) => e.feedMixingTank.pressmudFeed.ts,
          (e) => e.feedMixingTank.pressmudFeed.vs,
          (e) => e.feedMixingTank.slurry.ph
        ),
        cowDung: buildQuality(
          (e) => e.feedMixingTank.cowDungFeed.ts,
          (e) => e.feedMixingTank.cowDungFeed.vs,
          (e) => e.feedMixingTank.slurry.ph
        ),
        decanterPermeate: buildQuality(
          (e) => e.feedMixingTank.permeateFeed.ts,
          (e) => e.feedMixingTank.permeateFeed.vs
        ),
        water: buildQuality(
          (e) => e.feedMixingTank.waterTs,
          (e) => e.feedMixingTank.waterVs
        ),
        pulp: buildQuality(
          (e) => e.feedMixingTank.pulpFeed?.ts,
          (e) => e.feedMixingTank.pulpFeed?.vs
        ),
        maggie: buildQuality(
          (e) => e.feedMixingTank.maggieFeed?.ts,
          (e) => e.feedMixingTank.maggieFeed?.vs
        ),
        otherFeedSubstrate: buildQuality(
          (e) => e.feedMixingTank.otherFeedSubstrate?.ts,
          (e) => e.feedMixingTank.otherFeedSubstrate?.vs
        ),
      },
      digesterPerformance: {
        d01: d01Perf,
        d02: emptyDigesterPerf,
        d03: emptyDigesterPerf,
      },
      biogasQuality: {
        ch4: avg(filteredEntries.map((e) => e.rawBiogasQuality.ch4)),
        co2: avg(filteredEntries.map((e) => e.rawBiogasQuality.co2)),
        o2: avg(filteredEntries.map((e) => e.rawBiogasQuality.o2)),
        h2s: avg(filteredEntries.map((e) => e.rawBiogasQuality.h2s)),
        n2: avg(filteredEntries.map((e) => e.rawBiogasQuality.n2)),
      },
      biogasProduction: {
        rbgProduced: sum(
          filteredEntries.map((e) => e.rawBiogas.totalRawBiogas)
        ),
        rbgFlared: sum(filteredEntries.map((e) => e.rawBiogas.rbgFlared)),
        usedInKitchen: sum(
          filteredEntries.map(
            (e) => e.rawBiogas.totalRawBiogas * 0.02
          )
        ),
        sentToPurification: sum(
          filteredEntries.map(
            (e) => e.rawBiogas.totalRawBiogas - e.rawBiogas.rbgFlared
          )
        ),
      },
      cbgQuality: {
        ch4: avg(filteredEntries.map((e) => e.compressedBiogas.ch4)),
        co2: avg(filteredEntries.map((e) => e.compressedBiogas.co2)),
        o2: avg(filteredEntries.map((e) => e.compressedBiogas.o2)),
        h2s: avg(filteredEntries.map((e) => e.compressedBiogas.h2s)),
        n2: avg(filteredEntries.map((e) => e.compressedBiogas.n2)),
      },
      cbgProduction: {
        production: sum(
          filteredEntries.map((e) => e.compressedBiogas.produced)
        ),
        dispatch: sum(
          filteredEntries.map((e) => e.compressedBiogas.cbgSold)
        ),
        gasYield: avg(
          filteredEntries.map((e) => e.rawBiogas.gasYield)
        ),
        cf: avg(
          filteredEntries.map((e) => e.compressedBiogas.conversionRatio)
        ),
      },
      slsData: {
        decanter: {
          runHrs: sum(filteredEntries.map((e) => e.compressors.compressor1Hours)),
          slurryFeed: avg(filteredEntries.map((e) => e.slsMachine.slurryFeed / 24)),
          inletTs: avg(filteredEntries.map((e) => e.slsMachine.wetCakeTs)),
          totalSlurryFeed: sum(filteredEntries.map((e) => e.slsMachine.slurryFeed)),
        },
        screwPress: {
          runHrs: sum(filteredEntries.map((e) => e.compressors.compressor2Hours)),
          slurryFeed: avg(filteredEntries.map((e) => e.slsMachine.slurryFeed / 24)),
          inletTs: avg(filteredEntries.map((e) => e.slsMachine.wetCakeTs)),
          totalSlurryFeed: sum(filteredEntries.map((e) => e.slsMachine.slurryFeed)),
        },
      },
      fomLfom: {
        decanter: {
          wetCakeQty: sum(filteredEntries.map((e) => e.slsMachine.wetCakeProduction)),
          wetCakeTs: avg(filteredEntries.map((e) => e.slsMachine.wetCakeTs)),
          lfomQty: sum(filteredEntries.map((e) => e.slsMachine.liquidProduced)),
          lfomTs: avg(filteredEntries.map((e) => e.slsMachine.liquidTs)),
        },
        screwPress: {
          wetCakeQty: sum(filteredEntries.map((e) => e.fertilizer.fomProduced)),
          wetCakeTs: avg(filteredEntries.map((e) => e.slsMachine.wetCakeTs)),
          lfomQty: sum(filteredEntries.map((e) => e.slsMachine.liquidSentToLagoon)),
          lfomTs: avg(filteredEntries.map((e) => e.slsMachine.liquidTs)),
        },
      },
      slurryManagement: {
        directPurgeToFarmers: sum(
          filteredEntries.map(
            (e) =>
              e.digesters.reduce(
                (acc, d) => acc + (d.discharge?.totalSlurryOut || 0),
                0
              ) * 0.1
          )
        ),
        slsInlet: sum(filteredEntries.map((e) => e.slsMachine.slurryFeed)),
        directPurgeToLagoon: sum(
          filteredEntries.map((e) => e.slsMachine.liquidSentToLagoon * 0.2)
        ),
        totalSlurryOut: sum(
          filteredEntries.map((e) =>
            e.digesters.reduce(
              (acc, d) => acc + (d.discharge?.totalSlurryOut || 0),
              0
            )
          )
        ),
        totalPermeateToMixingTank: sum(
          filteredEntries.map((e) => e.feedMixingTank.permeateFeed.qty)
        ),
        totalLfomToLagoon: sum(
          filteredEntries.map((e) => e.slsMachine.liquidSentToLagoon)
        ),
        fomCakeDispatch: sum(filteredEntries.map((e) => e.fertilizer.sold)),
        lfomDispatch: sum(
          filteredEntries.map((e) => e.fertilizer.lagoonLiquidSold)
        ),
      },
      powerConsumption: sum(
        filteredEntries.map((e) => e.utilities.electricityConsumption)
      ),
      breakdownReasons:
        filteredEntries
          .filter(
            (e) =>
              e.remarks?.toLowerCase().includes('maintenance') ||
              e.remarks?.toLowerCase().includes('breakdown')
          )
          .map((e) => e.remarks)
          .join('; ') || 'No major breakdowns reported',
    };
  }, [
    filteredEntries,
    filterType,
    singleDate,
    startDate,
    endDate,
    selectedMonth,
    selectedQuarter,
    selectedYear,
  ]);

  const feedstockRows = useMemo(() => {
    if (!aggregatedData) return [];
    return [
      {
        name: 'Press Mud (tpd)',
        data: aggregatedData.feeding.pressMud,
        quality: aggregatedData.rawMaterialQuality.pressMud,
      },
      {
        name: 'Cow Dung (tpd)',
        data: aggregatedData.feeding.cowDung,
        quality: aggregatedData.rawMaterialQuality.cowDung,
      },
      {
        name: 'Decanter permeate (m3)',
        data: aggregatedData.feeding.decanterPermeate,
        quality: aggregatedData.rawMaterialQuality.decanterPermeate,
      },
      {
        name: 'Water (m3)',
        data: aggregatedData.feeding.water,
        quality: aggregatedData.rawMaterialQuality.water,
      },
      {
        name: 'Pulp (tpd)',
        data: aggregatedData.feeding.pulp,
        quality: aggregatedData.rawMaterialQuality.pulp,
      },
      {
        name: 'Maggie (tpd)',
        data: aggregatedData.feeding.maggie,
        quality: aggregatedData.rawMaterialQuality.maggie,
      },
      {
        name: 'Other Feed Substrate (tpd)',
        data: aggregatedData.feeding.otherFeedSubstrate,
        quality: aggregatedData.rawMaterialQuality.otherFeedSubstrate,
      },
      {
        name: 'Digester slurry (m3)',
        data: aggregatedData.feeding.digester03Slurry,
        quality: null,
      },
      {
        name: 'Total Feed Input (m3)',
        data: aggregatedData.feeding.totalFeedInput,
        quality: null,
      },
    ];
  }, [aggregatedData]);

  // Export to Excel with exact structure (xlsx loaded on demand to keep initial chunk small)
  const handleExportExcel = async () => {
    if (!aggregatedData) return;

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Create worksheet data matching the exact structure
    const wsData: (string | number | null)[][] = [
      // Row 1: Header
      [
        'Report',
        '',
        '4 TPD - SREL PLANT',
        '',
        '',
        '',
        '',
        '',
        '',
        'Date',
        filterType === 'single'
          ? singleDate
          : getFilterLabel(),
        '',
      ],
      // Row 2: Feeding Data & Raw Material Headers
      [
        "Name of the Feedstock's",
        'Feeding Data',
        '',
        'Raw material Quality Data',
        '',
        '',
      ],
      // Row 3: Column Headers (single digester — Digester + Total only)
      [
        '',
        'Digester',
        'Total',
        'TS%',
        'VS%',
        'pH',
      ],
      ...feedstockRows.map((row) => [
        row.name,
        row.data.d01.toFixed(2),
        row.data.total.toFixed(2),
        formatMaybeFixed(row.quality?.ts, 1),
        formatMaybeFixed(row.quality?.vs, 1),
        formatMaybeFixed(row.quality?.ph, 1),
      ]),
      // Empty Row
      ['', '', '', '', '', ''],
      // Digester Performance Report Header
      [
        'Digester Performance Report',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      // Digester Performance Column Headers
      [
        'Digesters',
        'TS%',
        'VS%',
        'pH',
        'VFA/TIC',
        'Slurry Level (m)',
        'HRT (days)',
        '',
        'OLR(kgVS/m3/day)',
        '',
        'Slurry avg. Temp (deg C)',
        '',
      ],
      // Digester Rows (single digester plant)
      [
        'Digester',
        aggregatedData.digesterPerformance.d01.ts.toFixed(1),
        aggregatedData.digesterPerformance.d01.vs.toFixed(1),
        aggregatedData.digesterPerformance.d01.ph.toFixed(1),
        aggregatedData.digesterPerformance.d01.vfaTic.toFixed(2),
        aggregatedData.digesterPerformance.d01.slurryLevel.toFixed(1),
        aggregatedData.digesterPerformance.d01.hrt.toFixed(1),
        '',
        aggregatedData.digesterPerformance.d01.olr.toFixed(2),
        '',
        aggregatedData.digesterPerformance.d01.temp.toFixed(1),
        '',
      ],
      [
        'Average',
        aggregatedData.digesterPerformance.d01.ts.toFixed(1),
        aggregatedData.digesterPerformance.d01.vs.toFixed(1),
        aggregatedData.digesterPerformance.d01.ph.toFixed(1),
        aggregatedData.digesterPerformance.d01.vfaTic.toFixed(2),
        aggregatedData.digesterPerformance.d01.slurryLevel.toFixed(1),
        aggregatedData.digesterPerformance.d01.hrt.toFixed(1),
        '',
        aggregatedData.digesterPerformance.d01.olr.toFixed(2),
        '',
        aggregatedData.digesterPerformance.d01.temp.toFixed(1),
        '',
      ],
      // Empty Row
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      // Biogas Quality & Production Headers
      [
        'Biogas Quality Report',
        '',
        '',
        '',
        '',
        'Biogas Production (Nm3)',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      // Biogas Column Headers
      [
        'CH4%',
        'CO2%',
        'O2%',
        'H2S ppm',
        'N2%',
        'RBG Produced (Nm3)',
        '',
        'RBG Flared (m3)',
        'Used in Kitchen (m3)',
        '',
        'Sent to Purification Unit (m3)',
        '',
      ],
      // Biogas Data Row
      [
        aggregatedData.biogasQuality.ch4.toFixed(1),
        aggregatedData.biogasQuality.co2.toFixed(1),
        aggregatedData.biogasQuality.o2.toFixed(1),
        aggregatedData.biogasQuality.h2s.toFixed(0),
        aggregatedData.biogasQuality.n2.toFixed(1),
        aggregatedData.biogasProduction.rbgProduced.toFixed(0),
        '',
        aggregatedData.biogasProduction.rbgFlared.toFixed(0),
        aggregatedData.biogasProduction.usedInKitchen.toFixed(0),
        '',
        aggregatedData.biogasProduction.sentToPurification.toFixed(0),
        '',
      ],
      // Empty Row
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      // CBG Quality & Production Headers
      [
        'CBG Quality Report',
        '',
        '',
        '',
        '',
        'CBG (Kg)',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      // CBG Column Headers
      [
        'CH4%',
        'CO2%',
        'O2%',
        'H2S ppm',
        'N2%',
        'Production (Kg)',
        '',
        'Dispatch(Kg)',
        '',
        'Gas Yield (m3/ton PM)',
        '',
        'CF',
      ],
      // CBG Data Row
      [
        aggregatedData.cbgQuality.ch4.toFixed(1),
        aggregatedData.cbgQuality.co2.toFixed(1),
        aggregatedData.cbgQuality.o2.toFixed(1),
        aggregatedData.cbgQuality.h2s.toFixed(0),
        aggregatedData.cbgQuality.n2.toFixed(1),
        aggregatedData.cbgProduction.production.toFixed(0),
        '',
        aggregatedData.cbgProduction.dispatch.toFixed(0),
        '',
        aggregatedData.cbgProduction.gasYield.toFixed(2),
        '',
        aggregatedData.cbgProduction.cf.toFixed(1),
      ],
      // Empty Row
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      // SLS & FOM Headers
      [
        'Solid Liquid Separator Operating Data',
        '',
        '',
        '',
        '',
        'FOM & LFOM Production',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      // SLS & FOM Column Headers
      [
        '',
        'Run. Hrs',
        'Slurry feed (m3/hr)',
        'Inlet TS%',
        'Total Slurry feed (m3/day)',
        'Wet Cake Qty (tpd)',
        'Wet Cake TS%',
        '',
        'LFOM qty (m3 or tpd)',
        '',
        'LFOM TS%',
        '',
      ],
      // Decanter Row
      [
        'Decanter',
        aggregatedData.slsData.decanter.runHrs.toFixed(0),
        aggregatedData.slsData.decanter.slurryFeed.toFixed(1),
        aggregatedData.slsData.decanter.inletTs.toFixed(1),
        aggregatedData.slsData.decanter.totalSlurryFeed.toFixed(0),
        aggregatedData.fomLfom.decanter.wetCakeQty.toFixed(0),
        aggregatedData.fomLfom.decanter.wetCakeTs.toFixed(1),
        '',
        aggregatedData.fomLfom.decanter.lfomQty.toFixed(0),
        '',
        aggregatedData.fomLfom.decanter.lfomTs.toFixed(1),
        '',
      ],
      // Screw Press Row
      [
        'Screw Press',
        aggregatedData.slsData.screwPress.runHrs.toFixed(0),
        aggregatedData.slsData.screwPress.slurryFeed.toFixed(1),
        aggregatedData.slsData.screwPress.inletTs.toFixed(1),
        aggregatedData.slsData.screwPress.totalSlurryFeed.toFixed(0),
        aggregatedData.fomLfom.screwPress.wetCakeQty.toFixed(0),
        aggregatedData.fomLfom.screwPress.wetCakeTs.toFixed(1),
        '',
        aggregatedData.fomLfom.screwPress.lfomQty.toFixed(0),
        '',
        aggregatedData.fomLfom.screwPress.lfomTs.toFixed(1),
        '',
      ],
      // Empty Row
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      // Slurry Management Header
      [
        'Slurry Management Data',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      // Slurry Management Column Headers
      [
        'Direct Purge Out to Farmers (m3)',
        'SLS inlet (m3)',
        'Direct Purge to Lagoon(m3)',
        'Total Slurry out (m3)',
        'Total permeate to Mixing Tank (m3)',
        '',
        'Total LFOM to Lagoon (m3)',
        '',
        'FOM Cake Dispatch (tons)',
        '',
        'LFOM Dispatch (tons)',
        '',
      ],
      // Slurry Management Data Row
      [
        aggregatedData.slurryManagement.directPurgeToFarmers.toFixed(0),
        aggregatedData.slurryManagement.slsInlet.toFixed(0),
        aggregatedData.slurryManagement.directPurgeToLagoon.toFixed(0),
        aggregatedData.slurryManagement.totalSlurryOut.toFixed(0),
        aggregatedData.slurryManagement.totalPermeateToMixingTank.toFixed(0),
        '',
        aggregatedData.slurryManagement.totalLfomToLagoon.toFixed(0),
        '',
        aggregatedData.slurryManagement.fomCakeDispatch.toFixed(0),
        '',
        aggregatedData.slurryManagement.lfomDispatch.toFixed(0),
        '',
      ],
      // Empty Row
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      // Power Consumption & Breakdown
      [
        'Total Power Consumptions (Kwh/day)',
        '',
        '',
        '',
        '',
        'Major Breakdown Reasons',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      // Power & Breakdown Data Row
      [
        aggregatedData.powerConsumption.toFixed(0),
        '',
        '',
        '',
        '',
        aggregatedData.breakdownReasons,
        '',
        '',
        '',
        '',
        '',
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 28 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Final MIS Report');

    const fileName =
      filterType === 'single'
        ? `Final_MIS_Report_${singleDate}.xlsx`
        : `Final_MIS_Report_${startDate}_to_${endDate}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  // Original report color palette (structure modernized; colors kept familiar)
  const colors = {
    headerPrimary: tokens.primary.main,
    headerSecondary: '#3d8cc4',
    sectionHeader: '#f8fafc',
    rowHeader: '#f1f5f9',
    accent1: '#e0f2fe',
    accent2: '#ecfdf5',
    accent3: '#fef3c7',
    accent4: '#fce7f3',
    border: '#e2e8f0',
    text: '#334155',
    textLight: '#64748b',
    rowAlt: '#fafbfc',
    surface: '#FFFFFF',
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'single':
        return singleDate;
      case 'week':
        return `Week ending ${singleDate}`;
      case 'month':
        return selectedMonth;
      case 'quarter':
        return `${selectedQuarter} ${selectedYear}`;
      case 'year':
        return selectedYear;
      case 'custom':
        return `${startDate} to ${endDate}`;
      default:
        return '';
    }
  };

  const filterButtons: { value: FilterType; label: string }[] = [
    { value: 'single', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <Box sx={{ pb: 3 }}>
        {loadError && (
          <Alert severity="error" onClose={() => setLoadError(null)} sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}
        <PageHeader
          dense
          title="Final MIS Report"
          subtitle="4 TPD - SREL PLANT · Consolidated data view"
        />

        {/* Mobile comprehensive view (phone only) */}
        {isPhone && aggregatedData && (
          <Box sx={{ mb: 2 }}>
            {/* Quick Summary */}
            <Accordion
              defaultExpanded
              sx={{
                borderRadius: '14px !important',
                mb: 2,
                '&:before': { display: 'none' },
                boxShadow: 2
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  minHeight: 56,
                  bgcolor: tokens.primary.soft,
                  color: tokens.primary.main,
                  borderRadius: '14px 14px 0 0',
                  '& .MuiAccordionSummary-content': { my: 1.5 }
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentOutlinedIcon sx={{ fontSize: 20 }} />
                  Quick Summary
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="body2" color="textSecondary">Records</Typography>
                    <Typography variant="body2" fontWeight={600}>{aggregatedData.recordCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="body2" color="textSecondary">Date Range</Typography>
                    <Typography variant="body2" fontWeight={600}>{aggregatedData.dateRange}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="body2" color="textSecondary">Total Raw Biogas</Typography>
                    <Typography variant="body2" fontWeight={600} color={tokens.primary.main}>{aggregatedData.biogasProduction.rbgProduced.toFixed(0)} m³</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="body2" color="textSecondary">CBG Produced</Typography>
                    <Typography variant="body2" fontWeight={600} color={tokens.success.main}>{aggregatedData.cbgProduction.production.toFixed(0)} kg</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2" color="textSecondary">Power Consumption</Typography>
                    <Typography variant="body2" fontWeight={600} color={tokens.chart.sales}>{aggregatedData.powerConsumption.toFixed(0)} kWh</Typography>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Feeding Data */}
            <Accordion sx={{ borderRadius: '14px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: tokens.shadow.sm }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Feeding Data</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.primary.main} mb={1.5}>Press Mud (tpd)</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Digester</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.feeding.pressMud.d01.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${tokens.border}` }}>
                          <Typography variant="body2" fontWeight={700}>Total</Typography>
                          <Typography variant="body2" fontWeight={700} color={tokens.primary.main}>{aggregatedData.feeding.pressMud.total.toFixed(2)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.success.main} mb={1.5}>Cow Dung (tpd)</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Digester</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.feeding.cowDung.d01.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${tokens.border}` }}>
                          <Typography variant="body2" fontWeight={700}>Total</Typography>
                          <Typography variant="body2" fontWeight={700} color={tokens.success.main}>{aggregatedData.feeding.cowDung.total.toFixed(2)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.chart.sales} mb={1.5}>Total Feed Input (m³)</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Digester</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.feeding.totalFeedInput.d01.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${tokens.border}` }}>
                          <Typography variant="body2" fontWeight={700}>Total</Typography>
                          <Typography variant="body2" fontWeight={700} color={tokens.chart.sales}>{aggregatedData.feeding.totalFeedInput.total.toFixed(2)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Digester Performance */}
            <Accordion sx={{ borderRadius: '14px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: tokens.shadow.sm }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>⚗️ Digester Performance</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={2}>
                  {['d01'].map((d, i) => {
                    const perf = aggregatedData.digesterPerformance[d];
                    return (
                      <Card key={d} sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm, border: `1px solid ${tokens.border}` }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="subtitle2" fontWeight={700} color={tokens.primary.main} mb={1.5}>
                            Digester
                          </Typography>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">TS%</Typography>
                              <Typography variant="body2" fontWeight={600}>{perf?.ts?.toFixed(1) ?? '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">VS%</Typography>
                              <Typography variant="body2" fontWeight={600}>{perf?.vs?.toFixed(1) ?? '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">pH</Typography>
                              <Typography variant="body2" fontWeight={600}>{perf?.ph?.toFixed(1) ?? '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">VFA/TIC</Typography>
                              <Typography variant="body2" fontWeight={600}>{perf?.vfaTic?.toFixed(2) ?? '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">HRT (days)</Typography>
                              <Typography variant="body2" fontWeight={600}>{perf?.hrt?.toFixed(1) ?? '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">OLR</Typography>
                              <Typography variant="body2" fontWeight={600}>{perf?.olr?.toFixed(2) ?? '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">Temperature (°C)</Typography>
                              <Typography variant="body2" fontWeight={600}>{perf?.temp?.toFixed(1) ?? '-'}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Biogas Quality & Production */}
            <Accordion sx={{ borderRadius: '14px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: tokens.shadow.sm }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>💨 Biogas Quality & Production</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.primary.main} mb={1.5}>Raw Biogas Quality</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">CH₄ (%)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasQuality.ch4.toFixed(1)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">CO₂ (%)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasQuality.co2.toFixed(1)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">H₂S (ppm)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasQuality.h2s.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">O₂ (%)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasQuality.o2.toFixed(1)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">N₂ (%)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasQuality.n2.toFixed(1)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.success.main} mb={1.5}>Raw Biogas Production</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">RBG Produced (m³)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasProduction.rbgProduced.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">RBG Flared (m³)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasProduction.rbgFlared.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Sent to Purification (m³)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.biogasProduction.sentToPurification.toFixed(0)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* CBG Quality & Production */}
            <Accordion sx={{ borderRadius: '14px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: tokens.shadow.sm }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>⛽ CBG Quality & Production</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.primary.main} mb={1.5}>CBG Quality</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">CH₄ (%)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.cbgQuality.ch4.toFixed(1)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">CO₂ (%)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.cbgQuality.co2.toFixed(1)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">H₂S (ppm)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.cbgQuality.h2s.toFixed(0)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.success.main} mb={1.5}>CBG Production</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Production (kg)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.cbgProduction.production.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Dispatch (kg)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.cbgProduction.dispatch.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Gas Yield (m³/kg VS)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.cbgProduction.gasYield.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Conversion Factor</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.cbgProduction.cf.toFixed(2)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* SLS & FOM Data */}
            <Accordion sx={{ borderRadius: '14px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: tokens.shadow.sm }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>SLS & FOM Data</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.primary.main} mb={1.5}>Decanter</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Run Hours</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.slsData.decanter.runHrs.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Wet Cake (kg)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.fomLfom.decanter.wetCakeQty.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Wet Cake TS%</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.fomLfom.decanter.wetCakeTs.toFixed(1)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">LFOM (m³)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.fomLfom.decanter.lfomQty.toFixed(0)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color={tokens.success.main} mb={1.5}>Screw Press</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Run Hours</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.slsData.screwPress.runHrs.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Wet Cake (kg)</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.fomLfom.screwPress.wetCakeQty.toFixed(0)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Wet Cake TS%</Typography>
                          <Typography variant="body2" fontWeight={600}>{aggregatedData.fomLfom.screwPress.wetCakeTs.toFixed(1)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Slurry Management */}
            <Accordion sx={{ borderRadius: '14px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: tokens.shadow.sm }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Slurry Management</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="body2" color="textSecondary">Total Slurry Out (m³)</Typography>
                    <Typography variant="body2" fontWeight={600}>{aggregatedData.slurryManagement.totalSlurryOut.toFixed(0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="body2" color="textSecondary">SLS Inlet (m³)</Typography>
                    <Typography variant="body2" fontWeight={600}>{aggregatedData.slurryManagement.slsInlet.toFixed(0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="body2" color="textSecondary">FOM Cake Dispatch (kg)</Typography>
                    <Typography variant="body2" fontWeight={600}>{aggregatedData.slurryManagement.fomCakeDispatch.toFixed(0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2" color="textSecondary">LFOM Dispatch (m³)</Typography>
                    <Typography variant="body2" fontWeight={600}>{aggregatedData.slurryManagement.lfomDispatch.toFixed(0)}</Typography>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Power & Breakdown */}
            <Accordion sx={{ borderRadius: '14px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: tokens.shadow.sm }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Power & Breakdown</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm, background: tokens.primary.soft }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="textSecondary" mb={0.5}>Total Power Consumption</Typography>
                      <Typography variant="h5" fontWeight={700} color={tokens.primary.main}>{aggregatedData.powerConsumption.toFixed(0)} kWh</Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ borderRadius: '14px', boxShadow: tokens.shadow.sm }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="textSecondary" mb={1}>Major Breakdown Reasons</Typography>
                      <Typography variant="body2" color="textPrimary" sx={{ lineHeight: 1.6 }}>{aggregatedData.breakdownReasons}</Typography>
                    </CardContent>
                  </Card>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Uniform enterprise filter toolbar */}
        <FilterToolbar
          dense
          title="Date Filters"
          titleAdornment={
            aggregatedData ? (
              <Chip
                size="small"
                label={`${aggregatedData.recordCount} record${aggregatedData.recordCount !== 1 ? 's' : ''}`}
                sx={{
                  height: 26,
                  fontWeight: 600,
                  fontSize: 12,
                  bgcolor: tokens.primary.soft,
                  color: tokens.primary.dark,
                  border: `1px solid ${tokens.primary.border}`,
                  borderRadius: '999px',
                  '& .MuiChip-label': { px: 1.25 },
                }}
              />
            ) : undefined
          }
          sx={{
            p: { xs: 1.75, sm: 2 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {/* Row 1 — period mode */}
            <SegmentedControl
              options={filterButtons}
              value={filterType}
              onChange={(value) => setFilterType(value as FilterType)}
              aria-label="Final MIS period filter"
              size="sm"
              sx={{ alignSelf: 'flex-start', maxWidth: '100%' }}
            />

            {/* Row 2 — period inputs + quick picks + primary actions */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.25,
                rowGap: 1.25,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 1.25,
                  flex: '1 1 auto',
                  minWidth: 0,
                }}
              >
                {filterType === 'single' && (
                  <AppDateField
                    value={singleDate}
                    onChange={setSingleDate}
                    label="Date"
                    sx={{ width: { xs: '100%', sm: 168 } }}
                  />
                )}
                {filterType === 'week' && (
                  <AppDateField
                    value={singleDate}
                    onChange={setSingleDate}
                    label="Week ending"
                    sx={{ width: { xs: '100%', sm: 168 } }}
                  />
                )}
                {filterType === 'month' && (
                  <AppDateField
                    viewsMode="month"
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    label="Month"
                    sx={{ width: { xs: '100%', sm: 168 } }}
                  />
                )}
                {filterType === 'quarter' && (
                  <>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 148 } }}>
                      <InputLabel>Quarter</InputLabel>
                      <Select
                        value={selectedQuarter}
                        label="Quarter"
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                      >
                        <MenuItem value="Q1">Q1 (Apr-Jun)</MenuItem>
                        <MenuItem value="Q2">Q2 (Jul-Sep)</MenuItem>
                        <MenuItem value="Q3">Q3 (Oct-Dec)</MenuItem>
                        <MenuItem value="Q4">Q4 (Jan-Mar)</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 110 } }}>
                      <InputLabel>Year</InputLabel>
                      <Select
                        value={selectedYear}
                        label="Year"
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
                          <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
                {filterType === 'year' && (
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 110 } }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Year"
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
                        <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {filterType === 'custom' && (
                  <>
                    <AppDateField
                      value={startDate}
                      onChange={setStartDate}
                      label="Start"
                      sx={{ width: { xs: '100%', sm: 160 } }}
                    />
                    <AppDateField
                      value={endDate}
                      onChange={setEndDate}
                      label="End"
                      sx={{ width: { xs: '100%', sm: 160 } }}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => loadData()}
                      disabled={loading || !startDate || !endDate || startDate > endDate}
                      sx={{ ...filterActionSx, height: 40 }}
                    >
                      Apply
                    </Button>
                  </>
                )}

                <Box
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    width: '1px',
                    alignSelf: 'stretch',
                    minHeight: 28,
                    bgcolor: tokens.divider,
                    mx: 0.25,
                  }}
                />

                {/* Quick ranges — same control height as fields/buttons */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                  {[
                    {
                      label: 'Today',
                      onClick: () => {
                        setFilterType('single');
                        setSingleDate(new Date().toISOString().split('T')[0]);
                      },
                    },
                    {
                      label: 'This Week',
                      onClick: () => {
                        setFilterType('week');
                        setSingleDate(new Date().toISOString().split('T')[0]);
                      },
                    },
                    {
                      label: 'This Month',
                      onClick: () => {
                        setFilterType('month');
                        setSelectedMonth(new Date().toISOString().slice(0, 7));
                      },
                    },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      variant="outlined"
                      color="inherit"
                      size="small"
                      onClick={item.onClick}
                      sx={{
                        height: 40,
                        px: 1.5,
                        minWidth: 0,
                        borderColor: tokens.border,
                        color: tokens.text.secondary,
                        fontWeight: 600,
                        fontSize: 13,
                        borderRadius: `${tokens.radius.button}px`,
                        bgcolor: tokens.surface,
                        '&:hover': {
                          borderColor: tokens.primary.border,
                          color: tokens.primary.main,
                          bgcolor: tokens.primary.soft,
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 1,
                  ml: { xs: 0, lg: 'auto' },
                }}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={loadData}
                  disabled={loading}
                  sx={{ ...filterActionSx, height: 40 }}
                >
                  {loading ? <CircularProgress size={18} color="inherit" /> : 'Load Report'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleExportExcel}
                  disabled={!aggregatedData || loading}
                  startIcon={<FileDownloadOutlinedIcon />}
                  sx={{ ...filterActionSx, height: 40, whiteSpace: 'nowrap' }}
                >
                  Export
                </Button>
              </Box>
            </Box>
          </Box>
        </FilterToolbar>

        {/* No Data Message */}
        {!aggregatedData && !loading && (
          <Box
            sx={{
              background: tokens.surface,
              borderRadius: `${tokens.radius.card}px`,
              p: 6,
              textAlign: 'center',
              boxShadow: tokens.shadow.sm,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: tokens.primary.soft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <SearchOutlinedIcon sx={{ fontSize: 36, color: tokens.text.secondary }} />
            </Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: tokens.text.primary,
                mb: 1,
              }}
            >
              No Records Found
            </Typography>
            <Typography sx={{ fontSize: 14, color: tokens.text.secondary }}>
              No MIS entries match the selected filter criteria. Try adjusting
              your date filters.
            </Typography>
          </Box>
        )}
        {loading && !aggregatedData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} role="status" aria-label="Loading report">
            <CircularProgress color="primary" />
          </Box>
        )}

        {/* MIS Report Table - Desktop/Tablet Only */}
        {aggregatedData && !isPhone && (
          <Box
            sx={{
              background: colors.surface,
              borderRadius: `${tokens.radius.card}px`,
              overflow: 'hidden',
              boxShadow: tokens.shadow.sm,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  minWidth: '1200px',
                  fontFamily: 'inherit',
                  tableLayout: 'fixed',
                }}
              >
                <tbody>
                  {/* Row 1: Report header — continuous bar, no empty spacer band */}
                  <tr>
                    <td
                      style={{
                        background: colors.headerPrimary,
                        color: '#fff',
                        padding: '14px 18px',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        borderBottom: `1px solid ${colors.headerSecondary}`,
                      }}
                    >
                      Report
                    </td>
                    <td
                      colSpan={8}
                      style={{
                        background: colors.headerPrimary,
                        color: '#fff',
                        padding: '14px 18px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '16px',
                        letterSpacing: '-0.01em',
                        borderBottom: `1px solid ${colors.headerSecondary}`,
                      }}
                    >
                      4 TPD - SREL PLANT
                    </td>
                    <td
                      style={{
                        background: colors.headerSecondary,
                        color: '#fff',
                        padding: '14px 18px',
                        fontWeight: 600,
                        borderBottom: `1px solid ${colors.headerSecondary}`,
                      }}
                    >
                      Period
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.headerSecondary,
                        color: '#fff',
                        padding: '14px 18px',
                        fontWeight: 500,
                        borderBottom: `1px solid ${colors.headerSecondary}`,
                      }}
                    >
                      {getFilterLabel()}
                    </td>
                  </tr>

                  {/* Row 2: Feeding + Quality section titles — Digester/Total/TS/VS/pH share equal width (2 cols each) */}
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent3,
                        padding: '11px 16px',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                        borderRight: `1px solid ${colors.border}`,
                      }}
                    >
                      Name of the Feedstock&apos;s
                    </td>
                    <td
                      colSpan={4}
                      style={{
                        background: colors.accent3,
                        padding: '11px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                        borderRight: `1px solid ${colors.border}`,
                      }}
                    >
                      Feeding Data
                    </td>
                    <td
                      colSpan={6}
                      style={{
                        background: colors.accent3,
                        padding: '11px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Raw material Quality Data
                    </td>
                  </tr>

                  {/* Row 3: equal-width data columns (each spans 2 of 12) */}
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.rowHeader,
                        padding: '9px 16px',
                        borderBottom: `1px solid ${colors.border}`,
                        borderRight: `1px solid ${colors.border}`,
                      }}
                    ></td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent2,
                        padding: '9px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                        width: '16.66%',
                      }}
                    >
                      Digester
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent2,
                        padding: '9px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                        borderRight: `1px solid ${colors.border}`,
                        width: '16.66%',
                      }}
                    >
                      Total
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent1,
                        padding: '9px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                        width: '16.66%',
                      }}
                    >
                      TS%
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent1,
                        padding: '9px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                        width: '16.66%',
                      }}
                    >
                      VS%
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent1,
                        padding: '9px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                        width: '16.66%',
                      }}
                    >
                      pH
                    </td>
                  </tr>

                  {/* Feedstock Rows */}
                  {feedstockRows.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? colors.surface : colors.rowAlt,
                      }}
                    >
                      <td
                        colSpan={2}
                        style={{
                          background: colors.rowHeader,
                          padding: '9px 16px',
                          fontWeight: 600,
                          color: colors.text,
                          borderBottom: `1px solid ${colors.border}`,
                          borderRight: `1px solid ${colors.border}`,
                        }}
                      >
                        {row.name}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          padding: '9px 12px',
                          textAlign: 'center',
                          color: colors.text,
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {row.data.d01.toFixed(2)}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          padding: '9px 12px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: colors.headerPrimary,
                          borderBottom: `1px solid ${colors.border}`,
                          borderRight: `1px solid ${colors.border}`,
                        }}
                      >
                        {row.data.total.toFixed(2)}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          padding: '9px 12px',
                          borderBottom: `1px solid ${colors.border}`,
                          textAlign: 'center',
                          color: colors.text,
                        }}
                      >
                        {formatMaybeFixed(row.quality?.ts, 1)}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          padding: '9px 12px',
                          textAlign: 'center',
                          color: colors.text,
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {formatMaybeFixed(row.quality?.vs, 1)}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          padding: '9px 12px',
                          textAlign: 'center',
                          color: colors.text,
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {formatMaybeFixed(row.quality?.ph, 1)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty Row */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        padding: '8px',
                        background: colors.sectionHeader,
                      }}
                    ></td>
                  </tr>

                  {/* Digester Performance Report Header */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        background: colors.accent3,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Digester Performance Report
                    </td>
                  </tr>

                  {/* Digester Performance Column Headers */}
                  <tr>
                    <td
                      style={{
                        background: colors.rowHeader,
                        padding: '10px 16px',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Digesters
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      TS%
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      VS%
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      pH
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      VFA/TIC
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Slurry Level (m)
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      HRT (days)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      OLR(kgVS/m3/day)
                    </td>
                    <td
                      colSpan={3}
                      style={{
                        background: colors.accent4,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Slurry avg. Temp (deg C)
                    </td>
                  </tr>

                  {/* Digester Rows — single digester plant */}
                  {['d01'].map((digester, idx) => {
                    const data =
                      aggregatedData.digesterPerformance[
                      digester as keyof typeof aggregatedData.digesterPerformance
                      ];
                    return (
                      <tr
                        key={digester}
                        style={{
                          background: idx % 2 === 0 ? colors.surface : colors.rowAlt,
                        }}
                      >
                        <td
                          style={{
                            background: colors.rowHeader,
                            padding: '10px 16px',
                            fontWeight: 500,
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          Digester
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.ts.toFixed(1)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.vs.toFixed(1)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.ph.toFixed(1)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.vfaTic.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.slurryLevel.toFixed(1)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.hrt.toFixed(1)}
                        </td>
                        <td
                          colSpan={2}
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.olr.toFixed(2)}
                        </td>
                        <td
                          colSpan={3}
                          style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: colors.text,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {data.temp.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Average Row Commented Out as requested 
                  <tr
                    style={{
                      background: colors.accent2,
                    }}
                  >
                    <td
                      style={{
                        background: colors.rowHeader,
                        padding: '10px 16px',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Average
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.ts +
                          aggregatedData.digesterPerformance.d02.ts +
                          aggregatedData.digesterPerformance.d03.ts) /
                        3
                      ).toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.vs +
                          aggregatedData.digesterPerformance.d02.vs +
                          aggregatedData.digesterPerformance.d03.vs) /
                        3
                      ).toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.ph +
                          aggregatedData.digesterPerformance.d02.ph +
                          aggregatedData.digesterPerformance.d03.ph) /
                        3
                      ).toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.vfaTic +
                          aggregatedData.digesterPerformance.d02.vfaTic +
                          aggregatedData.digesterPerformance.d03.vfaTic) /
                        3
                      ).toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.slurryLevel +
                          aggregatedData.digesterPerformance.d02.slurryLevel +
                          aggregatedData.digesterPerformance.d03.slurryLevel) /
                        3
                      ).toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.hrt +
                          aggregatedData.digesterPerformance.d02.hrt +
                          aggregatedData.digesterPerformance.d03.hrt) /
                        3
                      ).toFixed(1)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.olr +
                          aggregatedData.digesterPerformance.d02.olr +
                          aggregatedData.digesterPerformance.d03.olr) /
                        3
                      ).toFixed(2)}
                    </td>
                    <td
                      colSpan={3}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {(
                        (aggregatedData.digesterPerformance.d01.temp +
                          aggregatedData.digesterPerformance.d02.temp +
                          aggregatedData.digesterPerformance.d03.temp) /
                        3
                      ).toFixed(1)}
                    </td>
                  </tr>
                  */}

                  {/* Empty Row */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        padding: '8px',
                        background: colors.sectionHeader,
                      }}
                    ></td>
                  </tr>

                  {/* Biogas Quality & Production Headers */}
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        background: colors.accent3,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Biogas Quality Report
                    </td>
                    <td
                      colSpan={7}
                      style={{
                        background: colors.accent1,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Biogas Production (Nm3)
                    </td>
                  </tr>

                  {/* Biogas Column Headers */}
                  <tr>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      CH4%
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      CO2%
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      O2%
                    </td>
                    <td
                      style={{
                        background: colors.accent4,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      H2S ppm
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      N2%
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      RBG Produced (Nm3)
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      RBG Flared (m3)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Used in Kitchen (m3)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Sent to Purification Unit (m3)
                    </td>
                  </tr>

                  {/* Biogas Data Row */}
                  <tr>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasQuality.ch4.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasQuality.co2.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasQuality.o2.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasQuality.h2s.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasQuality.n2.toFixed(1)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasProduction.rbgProduced.toFixed(
                        0
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasProduction.rbgFlared.toFixed(0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasProduction.usedInKitchen.toFixed(
                        0
                      )}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.biogasProduction.sentToPurification.toFixed(
                        0
                      )}
                    </td>
                  </tr>

                  {/* Empty Row */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        padding: '8px',
                        background: colors.sectionHeader,
                      }}
                    ></td>
                  </tr>

                  {/* CBG Quality & Production Headers */}
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        background: colors.accent3,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      CBG Quality Report
                    </td>
                    <td style={{ background: colors.surface, padding: '12px 16px' }}></td>
                    <td
                      colSpan={7}
                      style={{
                        background: colors.accent4,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      CBG (Kg)
                    </td>
                  </tr>

                  {/* CBG Column Headers */}
                  <tr>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      CH4%
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      CO2%
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      O2%
                    </td>
                    <td
                      style={{
                        background: colors.accent4,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      H2S ppm
                    </td>
                    <td
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      N2%
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent4,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Production (Kg)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent4,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Dispatch(Kg)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent4,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 6,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Gas Yield (m3/ton PM)
                    </td>
                    <td
                      style={{
                        background: colors.accent4,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      CF
                    </td>
                  </tr>

                  {/* CBG Data Row */}
                  <tr>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgQuality.ch4.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgQuality.co2.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgQuality.o2.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgQuality.h2s.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgQuality.n2.toFixed(1)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgProduction.production.toFixed(0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgProduction.dispatch.toFixed(0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgProduction.gasYield.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.cbgProduction.cf.toFixed(1)}
                    </td>
                  </tr>

                  {/* Empty Row */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        padding: '8px',
                        background: colors.sectionHeader,
                      }}
                    ></td>
                  </tr>

                  {/* SLS & FOM Headers */}
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        background: colors.accent3,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Solid Liquid Separator Operating Data
                    </td>
                    <td
                      colSpan={7}
                      style={{
                        background: '#fef3c7',
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      FOM & LFOM Production
                    </td>
                  </tr>

                  {/* SLS & FOM Column Headers */}
                  <tr>
                    <td
                      style={{
                        background: colors.rowHeader,
                        padding: '10px 16px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    ></td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Run. Hrs
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Slurry feed (m3/hr)
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Inlet TS%
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Total Slurry feed (m3/day)
                    </td>
                    <td
                      style={{
                        background: '#fef3c7',
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Wet Cake Qty (tpd)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: '#fef3c7',
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Wet Cake TS%
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      LFOM qty (m3 or tpd)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent2,
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      LFOM TS%
                    </td>
                  </tr>

                  {/* Decanter Row */}
                  <tr>
                    <td
                      style={{
                        background: colors.rowHeader,
                        padding: '10px 16px',
                        fontWeight: 500,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Decanter
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.decanter.runHrs.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.decanter.slurryFeed.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.decanter.inletTs.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.decanter.totalSlurryFeed.toFixed(
                        0
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.decanter.wetCakeQty.toFixed(0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.decanter.wetCakeTs.toFixed(1)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.decanter.lfomQty.toFixed(0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.decanter.lfomTs.toFixed(1)}
                    </td>
                  </tr>

                  {/* Screw Press Row */}
                  <tr
                    style={{
                      background: colors.rowAlt,
                    }}
                  >
                    <td
                      style={{
                        background: colors.rowHeader,
                        padding: '10px 16px',
                        fontWeight: 500,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Screw Press
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.screwPress.runHrs.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.screwPress.slurryFeed.toFixed(
                        1
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.screwPress.inletTs.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slsData.screwPress.totalSlurryFeed.toFixed(
                        0
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.screwPress.wetCakeQty.toFixed(0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.screwPress.wetCakeTs.toFixed(1)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.screwPress.lfomQty.toFixed(0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.fomLfom.screwPress.lfomTs.toFixed(1)}
                    </td>
                  </tr>

                  {/* Empty Row */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        padding: '8px',
                        background: colors.sectionHeader,
                      }}
                    ></td>
                  </tr>

                  {/* Slurry Management Header */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        background: colors.accent3,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Slurry Management Data
                    </td>
                  </tr>

                  {/* Slurry Management Column Headers */}
                  <tr>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Direct Purge Out to Farmers (m3)
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      SLS inlet (m3)
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Direct Purge to Lagoon(m3)
                    </td>
                    <td
                      style={{
                        background: colors.accent1,
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Total Slurry out (m3)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent2,
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Total permeate to Mixing Tank (m3)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: colors.accent2,
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Total LFOM to Lagoon (m3)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: '#fef3c7',
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      FOM Cake Dispatch (tons)
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        background: '#fef3c7',
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.text,
                        fontSize: '11px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      LFOM Dispatch (tons)
                    </td>
                  </tr>

                  {/* Slurry Management Data Row */}
                  <tr>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.directPurgeToFarmers.toFixed(
                        0
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.slsInlet.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.directPurgeToLagoon.toFixed(
                        0
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.headerPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.totalSlurryOut.toFixed(
                        0
                      )}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.totalPermeateToMixingTank.toFixed(
                        0
                      )}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.totalLfomToLagoon.toFixed(
                        0
                      )}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.fomCakeDispatch.toFixed(
                        0
                      )}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {aggregatedData.slurryManagement.lfomDispatch.toFixed(
                        0
                      )}
                    </td>
                  </tr>

                  {/* Empty Row */}
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        padding: '8px',
                        background: colors.sectionHeader,
                      }}
                    ></td>
                  </tr>

                  {/* Power Consumption & Breakdown */}
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        background: colors.accent3,
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Total Power Consumptions (Kwh/day)
                    </td>
                    <td
                      colSpan={7}
                      style={{
                        background: '#f1f5f9',
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Major Breakdown Reasons
                    </td>
                  </tr>

                  {/* Power & Breakdown Data Row */}
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: colors.headerPrimary,
                      }}
                    >
                      {aggregatedData.powerConsumption.toFixed(0)} kWh
                    </td>
                    <td
                      colSpan={7}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: colors.textLight,
                        fontSize: '13px',
                      }}
                    >
                      {aggregatedData.breakdownReasons}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Box>
        )}

        {/* Summary Cards */}
        {aggregatedData && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mt: 3,
            }}
          >
            {[
              {
                label: 'Total Feed Input',
                value: `${(aggregatedData.feeding.totalFeedAmountTons ?? 0).toFixed(2)} tons`,
                icon: <WaterDropOutlinedIcon sx={{ fontSize: 22 }} />,
                color: tokens.primary.main,
              },
              {
                label: 'RBG Produced',
                value: `${aggregatedData.biogasProduction.rbgProduced.toFixed(0)} Nm³`,
                icon: <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 22 }} />,
                color: tokens.success.main,
              },
              {
                label: 'CBG Production',
                value: `${aggregatedData.cbgProduction.production.toFixed(0)} Kg`,
                icon: <LocalGasStationOutlinedIcon sx={{ fontSize: 22 }} />,
                color: tokens.danger.main,
              },
              {
                label: 'Power Consumption',
                value: `${aggregatedData.powerConsumption.toFixed(0)} kWh`,
                icon: <BoltOutlinedIcon sx={{ fontSize: 22 }} />,
                color: tokens.warning.main,
              },
            ].map((card, idx) => (
              <Box
                key={idx}
                sx={{
                  background: tokens.surface,
                  borderRadius: `${tokens.radius.card}px`,
                  p: 2.5,
                  boxShadow: tokens.shadow.sm,
                  border: `1px solid ${tokens.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'box-shadow 0.15s ease',
                  '&:hover': {
                    boxShadow: tokens.shadow.md,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    {card.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
  );
};

export default FinalMISPage;
