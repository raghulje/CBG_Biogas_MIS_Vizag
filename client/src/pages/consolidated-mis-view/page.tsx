
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Layout } from '../../components/Layout';
import { AppDateField } from '../../components/ui/AppDateField';

// Mock data for demonstration
const mockMISData = {
  date: '2024-01-15',
  plantName: '4 TPD - SREL PLANT',
  feedingData: {
    feedstocks: [
      { name: 'Press Mud (tpd)', d01: 7.2, d02: 0, d03: 0, total: 7.2 },
      { name: 'Cow Dung (tpd)', d01: 3.6, d02: 0, d03: 0, total: 3.6 },
      { name: 'Other feedstock (tpd)', d01: 0.8, d02: 0, d03: 0, total: 0.8 },
      { name: 'Decanter permeate (m3)', d01: 13.3, d02: 0, d03: 0, total: 13.3 },
      { name: 'Water (m3)', d01: 6.3, d02: 0, d03: 0, total: 6.3 },
      { name: 'Digester slurry (m3)', d01: 1.5, d02: 0, d03: 0, total: 1.5 },
      { name: 'Total Feed Input (m3)', d01: 32.7, d02: 0, d03: 0, total: 32.7 },
    ],
  },
  rawMaterialQuality: {
    ts: 8.5,
    vs: 82.3,
    ph: 6.8,
  },
  digesterPerformance: [
    { digester: 'Digester', ts: 4.2, vs: 68.5, ph: 7.1, vfaTic: 0.32, slurryLevel: 4.8, hrt: 28, olr: 2.8, temp: 38.5 },
    { digester: 'Average', ts: 4.2, vs: 68.5, ph: 7.1, vfaTic: 0.32, slurryLevel: 4.8, hrt: 28, olr: 2.8, temp: 38.5 },
  ],
  biogasQuality: {
    ch4: 58.5,
    co2: 38.2,
    o2: 0.8,
    h2s: 1850,
    n2: 2.5,
  },
  biogasProduction: {
    rbgProduced: 2450,
    rbgFlared: 120,
    usedInKitchen: 25,
    sentToPurification: 2305,
  },
  cbgQuality: {
    ch4: 96.8,
    co2: 1.2,
    o2: 0.3,
    h2s: 8,
    n2: 1.7,
  },
  cbgProduction: {
    production: 1250,
    dispatch: 1180,
    gasYield: 38.2,
    cf: 0.51,
  },
  separatorData: {
    decanter: { runHrs: 8.5, slurryFeed: 4.2, inletTs: 4.5, totalFeed: 35.7, wetCakeQty: 2.8, wetCakeTs: 28.5, lfomQty: 32.9, lfomTs: 2.1 },
    screwPress: { runHrs: 6.2, slurryFeed: 3.8, inletTs: 4.2, totalFeed: 23.6, wetCakeQty: 1.9, wetCakeTs: 32.1, lfomQty: 21.7, lfomTs: 1.8 },
  },
  fomProduction: {
    wetCakeQty: 4.7,
    wetCakeTs: 30.3,
    lfomQty: 54.6,
    lfomTs: 1.95,
  },
  slurryManagement: {
    directPurge: 2.5,
    slsInlet: 7.8,
    directPurgeLagoon: 1.2,
    totalSlurryOut: 11.5,
    totalPermeate: 54.6,
    lfomToLagoon: 12.3,
    fomCakeDispatch: 3.2,
    lfomDispatch: 8.5,
  },
  powerConsumption: 1850,
  breakdownReasons: 'Compressor maintenance - 2 hours scheduled downtime',
};

const ConsolidatedMISView = () => {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [animatedSections, setAnimatedSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setAnimatedSections((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [loading]);

  const getAnimationStyle = (index: number, delay: number = 0) => ({
    opacity: animatedSections.has(index) ? 1 : 0,
    transform: animatedSections.has(index) ? 'translateY(0)' : 'translateY(30px)',
    transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
  });

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#0B1F3A' }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ pb: 4 }}>
        {/* Header Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0B1F3A 0%, #F59E0B 50%, #059669 100%)',
            borderRadius: '20px',
            p: 3,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(11, 31, 58, 0.3)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>
                  Daily Report
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  {mockMISData.plantName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                <AppDateField
                  value={selectedDate}
                  onChange={setSelectedDate}
                  sx={{
                    minWidth: 160,
                    '& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                    },
                    '& .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  <i className="ri-download-2-line" style={{ marginRight: 8 }} />
                  Export Report
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Section 1: Feeding Data & Raw Material Quality */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[0] = el; }}
          data-index="0"
          sx={{ mb: 4, ...getAnimationStyle(0) }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
            {/* Feeding Data */}
            <GlassCard title="Feeding Data" color="#059669" icon="ri-plant-line">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr>
                      <TableHeader>Name of the Feedstock&apos;s</TableHeader>
                      <TableHeader align="center" bg="#059669">Digester</TableHeader>
                      <TableHeader align="center" bg="#0B1F3A">Total</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMISData.feedingData.feedstocks.map((row, idx) => (
                      <tr key={idx}>
                        <TableCell highlight={idx === mockMISData.feedingData.feedstocks.length - 1}>
                          {row.name}
                        </TableCell>
                        <TableCell align="center">{row.d01}</TableCell>
                        <TableCell align="center" highlight>{row.total}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </GlassCard>

            {/* Raw Material Quality Data */}
            <GlassCard title="Raw Material Quality Data" color="#DC2626" icon="ri-test-tube-line">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <MetricCard label="TS%" value={mockMISData.rawMaterialQuality.ts} unit="%" color="#0B1F3A" />
                <MetricCard label="VS%" value={mockMISData.rawMaterialQuality.vs} unit="%" color="#059669" />
                <MetricCard label="pH" value={mockMISData.rawMaterialQuality.ph} unit="" color="#DC2626" />
              </Box>
            </GlassCard>
          </Box>
        </Box>

        {/* Section 2: Digester Performance Report */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[1] = el; }}
          data-index="1"
          sx={{ mb: 4, ...getAnimationStyle(1, 100) }}
        >
          <GlassCard title="Digester Performance Report" color="#F59E21" icon="ri-dashboard-3-line" fullWidth>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr>
                    <TableHeader>Digesters</TableHeader>
                    <TableHeader align="center" bg="#059669">TS%</TableHeader>
                    <TableHeader align="center" bg="#059669">VS%</TableHeader>
                    <TableHeader align="center" bg="#059669">pH</TableHeader>
                    <TableHeader align="center" bg="#059669">VFA/TIC</TableHeader>
                    <TableHeader align="center" bg="#F59E21">Slurry Level (m)</TableHeader>
                    <TableHeader align="center" bg="#F59E21">HRT (days)</TableHeader>
                    <TableHeader align="center" bg="#F59E21">OLR (kgVS/m3/day)</TableHeader>
                    <TableHeader align="center" bg="#DC2626">Slurry avg. Temp (°C)</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {mockMISData.digesterPerformance.filter(row => row.digester !== 'Average').map((row, idx) => (
                    <tr key={idx}>
                      <TableCell highlight={row.digester === 'Average'}>{row.digester}</TableCell>
                      <TableCell align="center">{row.ts}</TableCell>
                      <TableCell align="center">{row.vs}</TableCell>
                      <TableCell align="center">{row.ph}</TableCell>
                      <TableCell align="center">{row.vfaTic}</TableCell>
                      <TableCell align="center">{row.slurryLevel}</TableCell>
                      <TableCell align="center">{row.hrt}</TableCell>
                      <TableCell align="center">{row.olr}</TableCell>
                      <TableCell align="center">{row.temp}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </GlassCard>
        </Box>

        {/* Section 3: Biogas Quality & Production */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[2] = el; }}
          data-index="2"
          sx={{ mb: 4, ...getAnimationStyle(2, 200) }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            {/* Biogas Quality Report */}
            <GlassCard title="Biogas Quality Report" color="#F59E0B" icon="ri-bubble-chart-line">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TableHeader align="center" bg="#059669">CH4%</TableHeader>
                      <TableHeader align="center" bg="#059669">CO2%</TableHeader>
                      <TableHeader align="center" bg="#059669">O2%</TableHeader>
                      <TableHeader align="center" bg="#DC2626">H2S ppm</TableHeader>
                      <TableHeader align="center" bg="#059669">N2%</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <TableCell align="center">{mockMISData.biogasQuality.ch4}</TableCell>
                      <TableCell align="center">{mockMISData.biogasQuality.co2}</TableCell>
                      <TableCell align="center">{mockMISData.biogasQuality.o2}</TableCell>
                      <TableCell align="center" highlight>{mockMISData.biogasQuality.h2s}</TableCell>
                      <TableCell align="center">{mockMISData.biogasQuality.n2}</TableCell>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </GlassCard>

            {/* Biogas Production */}
            <GlassCard title="Biogas Production (Nm3)" color="#047857" icon="ri-gas-station-line">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TableHeader align="center" bg="#F59E21">RBG Produced</TableHeader>
                      <TableHeader align="center" bg="#DC2626">RBG Flared</TableHeader>
                      <TableHeader align="center" bg="#059669">Used in Kitchen</TableHeader>
                      <TableHeader align="center" bg="#0B1F3A">Sent to Purification</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <TableCell align="center" highlight>{mockMISData.biogasProduction.rbgProduced}</TableCell>
                      <TableCell align="center">{mockMISData.biogasProduction.rbgFlared}</TableCell>
                      <TableCell align="center">{mockMISData.biogasProduction.usedInKitchen}</TableCell>
                      <TableCell align="center">{mockMISData.biogasProduction.sentToPurification}</TableCell>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </GlassCard>
          </Box>
        </Box>

        {/* Section 4: CBG Quality & Production */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[3] = el; }}
          data-index="3"
          sx={{ mb: 4, ...getAnimationStyle(3, 300) }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            {/* CBG Quality Report */}
            <GlassCard title="CBG Quality Report" color="#DC2626" icon="ri-fire-line">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TableHeader align="center" bg="#059669">CH4%</TableHeader>
                      <TableHeader align="center" bg="#059669">CO2%</TableHeader>
                      <TableHeader align="center" bg="#059669">O2%</TableHeader>
                      <TableHeader align="center" bg="#DC2626">H2S ppm</TableHeader>
                      <TableHeader align="center" bg="#059669">N2%</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <TableCell align="center" highlight>{mockMISData.cbgQuality.ch4}</TableCell>
                      <TableCell align="center">{mockMISData.cbgQuality.co2}</TableCell>
                      <TableCell align="center">{mockMISData.cbgQuality.o2}</TableCell>
                      <TableCell align="center">{mockMISData.cbgQuality.h2s}</TableCell>
                      <TableCell align="center">{mockMISData.cbgQuality.n2}</TableCell>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </GlassCard>

            {/* CBG Production */}
            <GlassCard title="CBG (Kg)" color="#0F2744" icon="ri-scales-3-line">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TableHeader align="center" bg="#F59E21">Production</TableHeader>
                      <TableHeader align="center" bg="#F59E21">Dispatch</TableHeader>
                      <TableHeader align="center" bg="#059669">Gas Yield (m3/ton PM)</TableHeader>
                      <TableHeader align="center" bg="#0B1F3A">CF</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <TableCell align="center" highlight>{mockMISData.cbgProduction.production}</TableCell>
                      <TableCell align="center">{mockMISData.cbgProduction.dispatch}</TableCell>
                      <TableCell align="center">{mockMISData.cbgProduction.gasYield}</TableCell>
                      <TableCell align="center">{mockMISData.cbgProduction.cf}</TableCell>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </GlassCard>
          </Box>
        </Box>

        {/* Section 5: Solid Liquid Separator & FOM Production */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[4] = el; }}
          data-index="4"
          sx={{ mb: 4, ...getAnimationStyle(4, 400) }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            {/* Solid Liquid Separator Operating Data */}
            <GlassCard title="Solid Liquid Separator Operating Data" color="#059669" icon="ri-filter-3-line">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr>
                      <TableHeader></TableHeader>
                      <TableHeader align="center" bg="#F59E0B">Run. Hrs</TableHeader>
                      <TableHeader align="center" bg="#F59E0B">Slurry feed (m3/hr)</TableHeader>
                      <TableHeader align="center" bg="#F59E0B">Inlet TS%</TableHeader>
                      <TableHeader align="center" bg="#0B1F3A">Total Slurry feed (m3/day)</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <TableCell highlight>Decanter</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.decanter.runHrs}</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.decanter.slurryFeed}</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.decanter.inletTs}</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.decanter.totalFeed}</TableCell>
                    </tr>
                    <tr>
                      <TableCell highlight>Screw Press</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.screwPress.runHrs}</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.screwPress.slurryFeed}</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.screwPress.inletTs}</TableCell>
                      <TableCell align="center">{mockMISData.separatorData.screwPress.totalFeed}</TableCell>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </GlassCard>

            {/* FOM & LFOM Production */}
            <GlassCard title="FOM & LFOM Production" color="#F59E21" icon="ri-recycle-line">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TableHeader align="center" bg="#DC2626">Wet Cake Qty (tpd)</TableHeader>
                      <TableHeader align="center" bg="#DC2626">Wet Cake TS%</TableHeader>
                      <TableHeader align="center" bg="#059669">LFOM qty (m3 or tpd)</TableHeader>
                      <TableHeader align="center" bg="#059669">LFOM TS%</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <TableCell align="center" highlight>{mockMISData.fomProduction.wetCakeQty}</TableCell>
                      <TableCell align="center">{mockMISData.fomProduction.wetCakeTs}</TableCell>
                      <TableCell align="center">{mockMISData.fomProduction.lfomQty}</TableCell>
                      <TableCell align="center">{mockMISData.fomProduction.lfomTs}</TableCell>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </GlassCard>
          </Box>
        </Box>

        {/* Section 6: Slurry Management Data */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[5] = el; }}
          data-index="5"
          sx={{ mb: 4, ...getAnimationStyle(5, 500) }}
        >
          <GlassCard title="Slurry Management Data" color="#0B1F3A" icon="ri-water-flash-line" fullWidth>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    <TableHeader align="center" bg="#F59E0B">Direct Purge Out to Farmers (m3)</TableHeader>
                    <TableHeader align="center" bg="#F59E0B">SLS inlet (m3)</TableHeader>
                    <TableHeader align="center" bg="#F59E0B">Direct Purge to Lagoon (m3)</TableHeader>
                    <TableHeader align="center" bg="#0B1F3A">Total Slurry out (m3)</TableHeader>
                    <TableHeader align="center" bg="#059669">Total permeate to Mixing Tank (m3)</TableHeader>
                    <TableHeader align="center" bg="#059669">Total LFOM to Lagoon (m3)</TableHeader>
                    <TableHeader align="center" bg="#F59E21">FOM Cake Dispatch (tons)</TableHeader>
                    <TableHeader align="center" bg="#F59E21">LFOM Dispatch (tons)</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <TableCell align="center">{mockMISData.slurryManagement.directPurge}</TableCell>
                    <TableCell align="center">{mockMISData.slurryManagement.slsInlet}</TableCell>
                    <TableCell align="center">{mockMISData.slurryManagement.directPurgeLagoon}</TableCell>
                    <TableCell align="center" highlight>{mockMISData.slurryManagement.totalSlurryOut}</TableCell>
                    <TableCell align="center">{mockMISData.slurryManagement.totalPermeate}</TableCell>
                    <TableCell align="center">{mockMISData.slurryManagement.lfomToLagoon}</TableCell>
                    <TableCell align="center">{mockMISData.slurryManagement.fomCakeDispatch}</TableCell>
                    <TableCell align="center">{mockMISData.slurryManagement.lfomDispatch}</TableCell>
                  </tr>
                </tbody>
              </table>
            </Box>
          </GlassCard>
        </Box>

        {/* Section 7: Power Consumption & Breakdown Reasons */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[6] = el; }}
          data-index="6"
          sx={{ mb: 4, ...getAnimationStyle(6, 600) }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3 }}>
            {/* Total Power Consumption */}
            <GlassCard title="Total Power Consumption" color="#DC2626" icon="ri-flashlight-line">
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 3,
                }}
              >
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(220, 38, 38,0.15) 0%, rgba(245,158,33,0.15) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #DC2626',
                    boxShadow: '0 8px 32px rgba(220, 38, 38,0.2)',
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#DC2626' }}>
                    {mockMISData.powerConsumption}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                    kWh/day
                  </Typography>
                </Box>
              </Box>
            </GlassCard>

            {/* Major Breakdown Reasons */}
            <GlassCard title="Major Breakdown Reasons" color="#111827" icon="ri-error-warning-line">
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(51,56,66,0.05) 0%, rgba(88,89,91,0.05) 100%)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(51,56,66,0.3)',
                  minHeight: 100,
                }}
              >
                <Typography variant="body1" sx={{ color: '#111827', lineHeight: 1.8 }}>
                  {mockMISData.breakdownReasons || 'No breakdown reported for this period.'}
                </Typography>
              </Box>
            </GlassCard>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          ref={(el: HTMLDivElement | null) => { sectionRefs.current[7] = el; }}
          data-index="7"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap',
            ...getAnimationStyle(7, 700),
          }}
        >
          {/* Action icons... */}
        </Box>
      </Box>
    </Layout>
  );
};

// Glass Card Component
interface GlassCardProps {
  title: string;
  color: string;
  icon: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const GlassCard = ({ title, color, icon, children }: GlassCardProps) => (
  <Box
    sx={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Box
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        borderBottom: `3px solid ${color}`,
        px: { xs: 2, md: 3 }, // Responsive padding
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: `0 4px 12px ${color}40`,
        }}
      >
        <i className={icon} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '1rem', md: '1.25rem' } }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
  </Box>
);

// Table Header Component
interface TableHeaderProps {
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  bg?: string;
}

const TableHeader = ({ children, align = 'left', bg }: TableHeaderProps) => (
  <th
    style={{
      padding: '12px 16px',
      textAlign: align,
      fontWeight: 600,
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: bg ? '#fff' : '#6B7280',
      background: bg || 'rgba(248, 249, 250, 0.95)', // Slightly more opaque for sticky
      borderBottom: '2px solid rgba(0,0,0,0.05)',
      whiteSpace: 'nowrap',
      position: 'sticky', // Sticky header
      top: 0,
      zIndex: 1,
    }}
  >
    {children}
  </th>
);

// Table Cell Component
interface TableCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  highlight?: boolean;
}

const TableCell = ({ children, align = 'left', highlight }: TableCellProps) => (
  <td
    style={{
      padding: '12px 16px',
      textAlign: align,
      fontSize: '14px',
      color: highlight ? '#0B1F3A' : '#111827',
      fontWeight: highlight ? 600 : 400,
      background: highlight ? 'rgba(11, 31, 58, 0.05)' : 'transparent',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </td>
);

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  color: string;
}

const MetricCard = ({ label, value, unit, color }: MetricCardProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 2,
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
      border: `1px solid ${color}20`,
    }}
  >
    <Typography variant="body1" sx={{ fontWeight: 500, color: '#6B7280' }}>
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: '#6B7280' }}>
        {unit}
      </Typography>
    </Box>
  </Box>
);

export default ConsolidatedMISView;
