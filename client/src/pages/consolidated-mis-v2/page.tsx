import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import { Layout } from '../../components/Layout';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { misService } from '../../services/misService';
import { AppDateField } from '../../components/ui/AppDateField';

type FilterType = 'financialYear' | 'quarter' | 'custom';

const currentYear = new Date().getFullYear();
const financialYearOptions = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - i;
  return { value: `${y}-${String(y + 1).slice(-2)}`, label: `${y}-${y + 1}` };
});

export default function ConsolidatedMISV2Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('financialYear');
  const [financialYear, setFinancialYear] = useState(financialYearOptions[0].value);
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);

  const fetchConsolidated = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filterType === 'financialYear') params.financialYear = financialYear;
      else if (filterType === 'quarter') {
        params.quarter = quarter;
        params.year = year;
      } else {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await misService.getConsolidatedData(params);
      setData(res);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to load consolidated data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filterType, financialYear, quarter, year, startDate, endDate]);

  useEffect(() => {
    fetchConsolidated();
  }, [fetchConsolidated]);

  const fmt = (v: number | undefined | null) =>
    v != null && !Number.isNaN(v) ? (Number(v) % 1 === 0 ? String(v) : Number(v).toFixed(2)) : '–';
  const rangeLabel =
    data?.startDate && data?.endDate
      ? `${data.startDate} to ${data.endDate}`
      : filterType === 'financialYear'
        ? `FY ${financialYear}`
        : filterType === 'quarter'
          ? `${quarter} ${year}`
          : 'Custom';

  if (loading && !data) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress color="primary" />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Consolidated MIS v2
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter by</InputLabel>
              <Select
                value={filterType}
                label="Filter by"
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                sx={{ backgroundColor: '#fff', borderRadius: '8px' }}
              >
                <MenuItem value="financialYear">Financial Year</MenuItem>
                <MenuItem value="quarter">Quarter (Q1–Q4)</MenuItem>
                <MenuItem value="custom">Custom Date Range</MenuItem>
              </Select>
            </FormControl>
            {filterType === 'financialYear' && (
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>FY</InputLabel>
                <Select
                  value={financialYear}
                  label="FY"
                  onChange={(e) => setFinancialYear(e.target.value)}
                  sx={{ backgroundColor: '#fff', borderRadius: '8px' }}
                >
                  {financialYearOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {filterType === 'quarter' && (
              <>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>Quarter</InputLabel>
                  <Select value={quarter} label="Quarter" onChange={(e) => setQuarter(e.target.value)} sx={{ backgroundColor: '#fff', borderRadius: '8px' }}>
                    <MenuItem value="Q1">Q1</MenuItem>
                    <MenuItem value="Q2">Q2</MenuItem>
                    <MenuItem value="Q3">Q3</MenuItem>
                    <MenuItem value="Q4">Q4</MenuItem>
                  </Select>
                </FormControl>
                <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || currentYear)} sx={{ width: 100, backgroundColor: '#fff', borderRadius: '8px' }} />
              </>
            )}
            {filterType === 'custom' && (
              <>
                <AppDateField label="Start" value={startDate} onChange={setStartDate} sx={{ backgroundColor: '#fff', borderRadius: '8px', width: 160 }} />
                <AppDateField label="End" value={endDate} onChange={setEndDate} sx={{ backgroundColor: '#fff', borderRadius: '8px', width: 160 }} />
              </>
            )}
            <Button variant="contained" onClick={fetchConsolidated} startIcon={<RefreshIcon />} sx={{ borderRadius: '8px', textTransform: 'none' }}>Refresh</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: '8px', textTransform: 'none' }}>Export Excel</Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: '12px',
            overflow: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <table className="mis-v2-table">
            <thead>
              <tr>
                <th colSpan={4} className="header-cell main-header" style={{ textAlign: 'left', backgroundColor: '#fdfdfd' }}>Daily Report (Consolidated)</th>
                <th colSpan={8} className="header-cell main-header" style={{ backgroundColor: '#fdfdfd', fontSize: '16px' }}>4 TPD - SREL PLANT</th>
                <th colSpan={4} className="header-cell main-header" style={{ textAlign: 'right', backgroundColor: '#fdfdfd' }}>{rangeLabel} · {data?.entryCount ?? 0} entries</th>
              </tr>
              <tr>
                <th rowSpan={2} className="header-cell sub-header-blue">Name of the Feedstock&apos;s</th>
                <th colSpan={2} className="header-cell sub-header-blue">Feeding Data</th>
                <th rowSpan={8} className="empty-spacer"></th>
                <th colSpan={3} className="header-cell sub-header-orange">Raw material Quality Data</th>
                <th rowSpan={8} className="empty-spacer-small"></th>
              </tr>
              <tr>
                <th className="header-cell col-header-blue">Digester</th>
                <th className="header-cell col-header-blue">Total</th>
                <th className="header-cell col-header-orange">TS%</th>
                <th className="header-cell col-header-orange">VS%</th>
                <th className="header-cell col-header-orange">pH</th>
              </tr>
            </thead>
            <tbody>
              {/* Feeding rows — single digester plant */}
              <tr>
                <td className="row-label">Press Mud (tpd)</td>
                <td className="data-cell">{fmt(data?.feeding?.pressMudD01 ?? data?.feeding?.pressMudTotal)}</td>
                <td className="data-cell total-cell">{fmt(data?.feeding?.pressMudTotal)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FCE4D6' }}>{fmt(data?.rawMaterialQuality?.tsPercent)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FCE4D6' }}>{fmt(data?.rawMaterialQuality?.vsPercent)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FCE4D6' }}>{fmt(data?.rawMaterialQuality?.ph)}</td>
              </tr>
              <tr>
                <td className="row-label">Cow Dung (tpd)</td>
                <td className="data-cell">{fmt(data?.feeding?.cowDungTotal)}</td>
                <td className="data-cell total-cell">{fmt(data?.feeding?.cowDungTotal)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
                <td className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
                <td className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
              </tr>
              <tr>
                <td className="row-label">Other feedstock (tpd)</td>
                <td className="data-cell">{fmt(data?.feeding?.otherFeedstockTotal)}</td>
                <td className="data-cell total-cell">{fmt(data?.feeding?.otherFeedstockTotal)}</td>
                <td colSpan={3} className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
              </tr>
              <tr>
                <td className="row-label">Decanter permeate (m3)</td>
                <td className="data-cell">{fmt(data?.feeding?.decanterPermeate)}</td>
                <td className="data-cell total-cell">{fmt(data?.feeding?.decanterPermeate)}</td>
                <td colSpan={3} className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
              </tr>
              <tr>
                <td className="row-label">water (m3)</td>
                <td className="data-cell">{fmt(data?.feeding?.water)}</td>
                <td className="data-cell total-cell">{fmt(data?.feeding?.water)}</td>
                <td colSpan={3} className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
              </tr>
              <tr>
                <td className="row-label">Digester slurry (m3)</td>
                <td className="data-cell">{fmt(data?.feeding?.digester03Slurry)}</td>
                <td className="data-cell total-cell">{fmt(data?.feeding?.digester03Slurry)}</td>
                <td colSpan={3} className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
              </tr>
              <tr>
                <td className="row-label" style={{ backgroundColor: '#4472C4', color: '#fff' }}>Total Feed Input (m3)</td>
                <td className="data-cell" style={{ backgroundColor: '#BDD7EE' }}>{fmt(data?.feeding?.totalFeedInput)}</td>
                <td className="data-cell" style={{ backgroundColor: '#BDD7EE' }}>{fmt(data?.feeding?.totalFeedInput)}</td>
                <td colSpan={3} className="data-cell" style={{ backgroundColor: '#FCE4D6' }}></td>
              </tr>

              {/* Digester Performance */}
              <tr>
                <td colSpan={16} className="section-header-teal" style={{ backgroundColor: '#00FFFF' }}>Digester Performance Report</td>
              </tr>
              <tr className="col-headers-row">
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }}>Digesters</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }}>TS%</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }}>VS%</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }}>pH</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }}>VFA/TIC</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }} colSpan={2}>Slurry Level (m)</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }} colSpan={2}>HRT (days)</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }} colSpan={3}>OLR(kgVS/m3/day)</td>
                <td className="header-cell" style={{ backgroundColor: '#A3E4D7' }} colSpan={4}>Slurry avg. Temp (deg C)</td>
              </tr>
              {(data?.digesters || []).map((d: any) => (
                <tr key={d.name}>
                  <td className="row-label">{d.name}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(d.ts)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(d.vs)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(d.ph)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(d.vfaTic)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={2}>{fmt(d.slurryLevel)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={2}>{fmt(d.hrt)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={3}>{fmt(d.olr)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={4}>{fmt(d.temp)}</td>
                </tr>
              ))}
              {/* Average row commented out as requested
              {data?.digesterAverage && (
                <tr>
                  <td className="row-label">Average</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(data.digesterAverage.ts)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(data.digesterAverage.vs)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(data.digesterAverage.ph)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }}>{fmt(data.digesterAverage.vfaTic)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={2}>{fmt(data.digesterAverage.slurryLevel)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={2}>{fmt(data.digesterAverage.hrt)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={3}>{fmt(data.digesterAverage.olr)}</td>
                  <td className="data-cell" style={{ backgroundColor: '#E8F8F5' }} colSpan={4}>{fmt(data.digesterAverage.temp)}</td>
                </tr>
              )}
              */}

              {/* Biogas Quality & Production */}
              <tr>
                <td colSpan={7} className="section-header-green" style={{ backgroundColor: '#92D050' }}>Biogas Quality Report</td>
                <td colSpan={9} className="section-header-yellow" style={{ backgroundColor: '#FFC000' }}>Biogas Production (Nm3)</td>
              </tr>
              <tr className="col-headers-row">
                <td className="header-cell" style={{ backgroundColor: '#E2F0D9' }}>CH4%</td>
                <td className="header-cell" style={{ backgroundColor: '#E2F0D9' }}>CO2%</td>
                <td className="header-cell" style={{ backgroundColor: '#E2F0D9' }}>O2%</td>
                <td className="header-cell" style={{ backgroundColor: '#FCE4D6' }}>H2S ppm</td>
                <td className="header-cell" style={{ backgroundColor: '#E2F0D9' }} colSpan={3}>N2%</td>
                <td className="header-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={2}>RBG Produced (Nm3)</td>
                <td className="header-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={2}>RBG Flared (m3)</td>
                <td className="header-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={2}>Used in Kitchen (m3)</td>
                <td className="header-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={3}>Sent to Purification Unit (m3)</td>
              </tr>
              <tr>
                <td className="data-cell" style={{ backgroundColor: '#E2F0D9' }}>{fmt(data?.biogasQuality?.ch4)}</td>
                <td className="data-cell" style={{ backgroundColor: '#E2F0D9' }}>{fmt(data?.biogasQuality?.co2)}</td>
                <td className="data-cell" style={{ backgroundColor: '#E2F0D9' }}>{fmt(data?.biogasQuality?.o2)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FCE4D6' }}>{fmt(data?.biogasQuality?.h2s)}</td>
                <td className="data-cell" style={{ backgroundColor: '#E2F0D9' }} colSpan={3}>{fmt(data?.biogasQuality?.n2)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={2}>{fmt(data?.biogasProduction?.rbgProduced)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={2}>{fmt(data?.biogasProduction?.rbgFlared)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={2}>{fmt(data?.biogasProduction?.usedInKitchen)}</td>
                <td className="data-cell" style={{ backgroundColor: '#FFF2CC' }} colSpan={3}>{fmt(data?.biogasProduction?.sentToPurification)}</td>
              </tr>

              {/* CBG Quality & CBG (Kg) */}
              <tr>
                <td colSpan={7} className="section-header-green-dark" style={{ backgroundColor: '#00B050', color: '#fff' }}>CBG Quality Report</td>
                <td colSpan={9} className="section-header-pink" style={{ backgroundColor: '#FF33CC', color: '#fff' }}>CBG (Kg)</td>
              </tr>
              <tr className="col-headers-row">
                <td className="header-cell" style={{ backgroundColor: '#C6E0B4' }}>CH4%</td>
                <td className="header-cell" style={{ backgroundColor: '#C6E0B4' }}>CO2%</td>
                <td className="header-cell" style={{ backgroundColor: '#C6E0B4' }}>O2%</td>
                <td className="header-cell" style={{ backgroundColor: '#FCE4D6' }}>H2S ppm</td>
                <td className="header-cell" style={{ backgroundColor: '#C6E0B4' }} colSpan={3}>N2%</td>
                <td className="header-cell" style={{ backgroundColor: '#F8CBAD' }} colSpan={2}>Production (Kg)</td>
                <td className="header-cell" style={{ backgroundColor: '#F8CBAD' }} colSpan={2}>Dispatch (Kg)</td>
                <td className="header-cell" style={{ backgroundColor: '#F8CBAD' }} colSpan={2}>Gas Yield (m3/ton PM)</td>
                <td className="header-cell" style={{ backgroundColor: '#F8CBAD' }} colSpan={3}>CF</td>
              </tr>
              <tr>
                <td className="data-cell half-height" style={{ backgroundColor: '#C6E0B4' }}>{fmt(data?.cbgQuality?.ch4)}</td>
                <td className="data-cell half-height" style={{ backgroundColor: '#C6E0B4' }}>{fmt(data?.cbgQuality?.co2)}</td>
                <td className="data-cell half-height" style={{ backgroundColor: '#C6E0B4' }}>{fmt(data?.cbgQuality?.o2)}</td>
                <td className="data-cell half-height" style={{ backgroundColor: '#FCE4D6' }}>{fmt(data?.cbgQuality?.h2s)}</td>
                <td className="data-cell half-height" colSpan={3} style={{ backgroundColor: '#C6E0B4' }}>{fmt(data?.cbgQuality?.n2)}</td>
                <td className="data-cell half-height" colSpan={2} style={{ backgroundColor: '#F8CBAD' }}>{fmt(data?.cbgKg?.production)}</td>
                <td className="data-cell half-height" colSpan={2} style={{ backgroundColor: '#F8CBAD' }}>{fmt(data?.cbgKg?.dispatch)}</td>
                <td className="data-cell half-height" colSpan={2} style={{ backgroundColor: '#F8CBAD' }}>{fmt(data?.cbgKg?.gasYield)}</td>
                <td className="data-cell half-height" colSpan={3} style={{ backgroundColor: '#F8CBAD' }}>{fmt(data?.cbgKg?.cf)}</td>
              </tr>

              {/* SLS */}
              <tr>
                <td colSpan={7} className="section-header-grey" style={{ backgroundColor: '#A6A6A6' }}>Solid Liquid Separator Operating Data</td>
                <td colSpan={9} className="section-header-grey-dark" style={{ backgroundColor: '#7F7F7F', color: '#fff' }}>FOM & LFOM Production</td>
              </tr>
              <tr className="col-headers-row">
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }}></td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }}>Run. Hrs</td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }}>Slurry feed (m3/hr)</td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }}>Inlet TS%</td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }} colSpan={3}>Total Slurry feed (m3/day)</td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }} colSpan={2}>Wet Cake Qty (tpd)</td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }} colSpan={2}>Wet Cake TS%</td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }} colSpan={2}>LFOM qty (m3 or tpd)</td>
                <td className="header-cell" style={{ backgroundColor: '#D9D9D9' }} colSpan={3}>LFOM TS%</td>
              </tr>
              <tr>
                <td className="row-label">Decanter</td>
                <td className="data-cell" style={{ backgroundColor: '#EFEFEF' }}>{fmt(data?.sls?.runHrs)}</td>
                <td className="data-cell" style={{ backgroundColor: '#EFEFEF' }}>{fmt(data?.sls?.slurryFeed)}</td>
                <td className="data-cell" style={{ backgroundColor: '#EFEFEF' }}>–</td>
                <td className="data-cell" colSpan={3} style={{ backgroundColor: '#EFEFEF' }}>{fmt(data?.sls?.totalSlurryFeed)}</td>
                <td className="data-cell" colSpan={2} style={{ backgroundColor: '#EFEFEF' }}>{fmt(data?.sls?.wetCakeQty)}</td>
                <td className="data-cell" colSpan={2} style={{ backgroundColor: '#EFEFEF' }}>{fmt(data?.sls?.wetCakeTS)}</td>
                <td className="data-cell" colSpan={2} style={{ backgroundColor: '#EFEFEF' }}>{fmt(data?.fomLfom?.lfomQty)}</td>
                <td className="data-cell" colSpan={3} style={{ backgroundColor: '#EFEFEF' }}>{fmt(data?.fomLfom?.lfomTS)}</td>
              </tr>

              {/* Slurry Management */}
              <tr>
                <td colSpan={16} className="section-header-green-light" style={{ backgroundColor: '#C6E0B4' }}>Slurry Management Data</td>
              </tr>
              <tr className="col-headers-row row-tall">
                <td className="header-cell col-header-green-light">Direct Purge Out to Farmers (m3)</td>
                <td className="header-cell col-header-green-light">SLS inlet (m3)</td>
                <td className="header-cell col-header-green-light">Direct Purge to Lagoon (m3)</td>
                <td className="header-cell col-header-green-light">Total Slurry out (m3)</td>
                <td className="header-cell col-header-green-light">Total permeate to Mixing Tank (m3)</td>
                <td className="header-cell col-header-green-light" colSpan={3}>Total LFOM to Lagoon (m3)</td>
                <td className="header-cell col-header-green-light" colSpan={3}>FOM Cake Dispatch (tons)</td>
                <td className="header-cell col-header-green-light" colSpan={5}>LFOM Dispatch (tons)</td>
              </tr>
              <tr>
                <td className="data-cell">{fmt(data?.slurryManagement?.directPurgeFarmers)}</td>
                <td className="data-cell">{fmt(data?.slurryManagement?.slsInlet)}</td>
                <td className="data-cell">{fmt(data?.slurryManagement?.directPurgeLagoon)}</td>
                <td className="data-cell">{fmt(data?.slurryManagement?.totalSlurryOut)}</td>
                <td className="data-cell">{fmt(data?.slurryManagement?.permeateToMixing)}</td>
                <td className="data-cell" colSpan={3}>{fmt(data?.slurryManagement?.lfomToLagoon)}</td>
                <td className="data-cell" colSpan={3}>{fmt(data?.slurryManagement?.fomDispatch)}</td>
                <td className="data-cell" colSpan={5}>{fmt(data?.slurryManagement?.lfomDispatch)}</td>
              </tr>

              {/* Footer */}
              <tr className="col-headers-row">
                <td colSpan={6} className="header-cell col-header-orange-dark" style={{ backgroundColor: '#FF8C00' }}>Total Power Consumptions (Kwh/day)</td>
                <td colSpan={10} className="header-cell col-header-grey-darker" style={{ backgroundColor: '#7F7F7F', color: '#fff' }}>Major Breakdown Reasons</td>
              </tr>
              <tr>
                <td colSpan={6} className="data-cell footer-data">{fmt(data?.powerConsumption)}</td>
                <td colSpan={10} rowSpan={2} className="data-cell footer-reason">{data?.breakdownReasons || '–'}</td>
              </tr>
              <tr>
                <td colSpan={6} className="data-cell footer-data"></td>
              </tr>
            </tbody>
          </table>
        </Paper>

        <style>{`
          .mis-v2-table { width: 100%; border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; font-size: 10.5px; table-layout: fixed; border: 2px solid #333; }
          .header-cell { border: 1px solid #777; padding: 4px 2px; text-align: center; font-weight: 700; }
          .main-header { background-color: #f2f2f2; font-size: 12px; padding: 6px; border-bottom: 2px solid #333; }
          .sub-header-blue { background-color: #BDD7EE; color: #000; border-bottom: 1px solid #777; }
          .col-header-blue { background-color: #DDEBF7; }
          .sub-header-orange { background-color: #F8CBAD; }
          .col-header-orange { background-color: #FCE4D6; }
          .empty-spacer { background-color: #d9d9d9; width: 100px; }
          .empty-spacer-small { background-color: #d9d9d9; width: 20px; }
          .row-label { border: 1px solid #777; padding: 4px 6px; font-weight: 700; background-color: #f2f2f2; text-align: left; }
          .data-cell { border: 1px solid #777; padding: 4px; height: 22px; text-align: center; }
          .total-cell { background-color: #d9d9d9; }
          .section-header-teal, .section-header-green, .section-header-yellow, .section-header-green-dark, .section-header-pink, .section-header-grey, .section-header-grey-dark, .section-header-green-light { border: 1px solid #777; padding: 5px; text-align: center; font-weight: 700; font-size: 11px; }
          .col-headers-row { font-weight: 700; }
          .row-tall { height: 48px; }
          .footer-data { background-color: #FFF2CC; height: 30px; }
          .footer-reason { background-color: #fff; vertical-align: top; text-align: left; padding: 6px; height: 60px; font-style: italic; }
          .half-height { height: 16px; }
          .col-header-green-light { background-color: #C6E0B4; }
          .col-header-orange-dark { background-color: #FF8C00; color: #fff; }
          .col-header-grey-darker { background-color: #7F7F7F; color: #fff; }
          @media print { .MuiButton-root, .MuiTextField-root, .MuiFormControl-root { display: none; } .mis-v2-table { font-size: 8px; border: 1px solid #000; } }
        `}</style>
      </Box>
    </Layout>
  );
}
