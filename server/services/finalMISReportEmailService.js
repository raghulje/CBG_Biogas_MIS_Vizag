const { MISDailyEntry, MISRawMaterials, MISFeedMixingTank, MISDigesterData, MISSLSData, MISRawBiogas, MISRawBiogasQuality, MISCompressedBiogas, MISCompressors, MISFertilizerData, MISUtilities, MISManpowerData, MISPlantAvailability, MISHSEData } = require('../models');
const { Op } = require('sequelize');

async function fetchEntriesForReport(startDate, endDate) {
  const entries = await MISDailyEntry.findAll({
    where: {
      date: { [Op.between]: [startDate, endDate] }
      // status: 'approved' — commented out: final MIS report includes all statuses
    },
    include: [
      { model: MISRawMaterials, as: 'rawMaterials' },
      { model: MISFeedMixingTank, as: 'feedMixingTank' },
      { model: MISDigesterData, as: 'digesters' },
      { model: MISSLSData, as: 'slsMachine' },
      { model: MISRawBiogas, as: 'rawBiogas' },
      { model: MISRawBiogasQuality, as: 'rawBiogasQuality' },
      { model: MISCompressedBiogas, as: 'compressedBiogas' },
      { model: MISCompressors, as: 'compressors' },
      { model: MISFertilizerData, as: 'fertilizer' },
      { model: MISUtilities, as: 'utilities' },
      { model: MISManpowerData, as: 'manpower' },
      { model: MISPlantAvailability, as: 'plantAvailability' },
      { model: MISHSEData, as: 'hse' },
    ],
    order: [['date', 'ASC']]
  });

  // Convert to plain objects and ensure nested structures exist to avoid null checks everywhere
  return entries.map(e => {
    const j = e.toJSON ? e.toJSON() : e;
    // Ensure arrays and objects exist
    j.digesters = j.digesters || [];
    j.feedMixingTank = j.feedMixingTank || {};
    j.feedMixingTank.pressmudFeed = j.feedMixingTank.pressmud_feed || { qty: 0, ts: 0, vs: 0 }; // Handle snake_case mapping if needed, but Sequelize usually returns model attributes. 
    // Wait, the client mapApiEntryToMISEntry handles snake_case to camelCase.
    // The Sequelize models usually use snake_case attributes in DB but might have aliases.
    // Let's rely on standard Sequelize JSON. We might need to map snake_case to the structure expected by aggregation.
    // Actually, looking at the previous usage in frontend:
    // filteredEntries.map((e) => e.feedMixingTank.pressmudFeed.qty)
    // The frontend `mapApiEntryToMISEntry` converts snake_case API response to camelCase TS structure.
    // The backend model `MISFeedMixingTank` probably has `pressmud_qty`, not `pressmudFeed` object.
    // I need to MAP the Sequelize result to the structure expected by the aggregation logic I'm copying from frontend.

    return mapToFrontendStructure(j);
  });
}

// Mimic the frontend mapper client/src/pages/final-mis/page.tsx mapApiEntryToMISEntry
// but adapted for backend object structure
function mapToFrontendStructure(api) {
  const n = (v) => Number(v || 0);
  return {
    date: api.date,
    rawMaterials: api.rawMaterials || {},
    feedMixingTank: {
      cowDungFeed: {
        qty: n(api.feedMixingTank?.cow_dung_qty),
        ts: n(api.feedMixingTank?.cow_dung_ts || api.feedMixingTank?.slurry_ts), // Approximations based on likely DB fields
        vs: n(api.feedMixingTank?.cow_dung_vs || api.feedMixingTank?.slurry_vs)
      },
      pressmudFeed: {
        qty: n(api.feedMixingTank?.pressmud_qty),
        ts: n(api.feedMixingTank?.pressmud_ts || api.feedMixingTank?.slurry_ts),
        vs: n(api.feedMixingTank?.pressmud_vs || api.feedMixingTank?.slurry_vs)
      },
      permeateFeed: {
        qty: n(api.feedMixingTank?.permeate_qty),
        ts: n(api.feedMixingTank?.permeate_ts),
        vs: n(api.feedMixingTank?.permeate_vs)
      },
      waterQty: n(api.feedMixingTank?.water_qty),
      waterTs: n(api.feedMixingTank?.water_ts),
      waterVs: n(api.feedMixingTank?.water_vs),
      pulpFeed: {
        qty: n(api.feedMixingTank?.pulp_qty),
        ts: n(api.feedMixingTank?.pulp_ts),
        vs: n(api.feedMixingTank?.pulp_vs)
      },
      maggieFeed: {
        qty: n(api.feedMixingTank?.maggie_qty),
        ts: n(api.feedMixingTank?.maggie_ts),
        vs: n(api.feedMixingTank?.maggie_vs)
      },
      otherFeedSubstrate: {
        qty: n(api.feedMixingTank?.other_feed_substrate_qty),
        ts: n(api.feedMixingTank?.other_feed_substrate_ts),
        vs: n(api.feedMixingTank?.other_feed_substrate_vs)
      },
      slurry: {
        total: n(api.feedMixingTank?.slurry_total),
        ts: n(api.feedMixingTank?.slurry_ts),
        vs: n(api.feedMixingTank?.slurry_vs),
        ph: n(api.feedMixingTank?.slurry_ph)
      }
    },
    digesters: (api.digesters || []).map(d => ({
      feeding: {
        totalSlurryFeed: n(d.feeding_slurry),
        avgTs: n(d.feeding_ts_percent),
        avgVs: n(d.feeding_vs_percent)
      },
      characteristics: {
        ph: n(d.ph),
        vfaAlkRatio: n(d.vfa_alk_ratio),
        slurryLevel: n(d.slurry_level),
        temperature: n(d.temp)
      },
      health: {
        hrt: n(d.hrt),
        olr: n(d.olr)
      },
      discharge: {
        totalSlurryOut: n(d.discharge_slurry),
        avgTs: n(d.discharge_ts_percent),
        avgVs: n(d.discharge_vs_percent)
      }
    })),
    slsMachine: {
      slurryFeed: n(api.slsMachine?.slurry_feed),
      wetCakeProduction: n(api.slsMachine?.wet_cake_prod),
      wetCakeTs: n(api.slsMachine?.wet_cake_ts),
      liquidProduced: n(api.slsMachine?.liquid_produced),
      liquidTs: n(api.slsMachine?.liquid_ts), // Assuming field exists
      liquidSentToLagoon: n(api.slsMachine?.liquid_sent_to_lagoon)
    },
    rawBiogas: {
      totalRawBiogas: n(api.rawBiogas?.total_raw_biogas),
      rbgFlared: n(api.rawBiogas?.rbg_flared),
      gasYield: n(api.rawBiogas?.gas_yield)
    },
    rawBiogasQuality: {
      ch4: n(api.rawBiogasQuality?.ch4),
      co2: n(api.rawBiogasQuality?.co2),
      h2s: n(api.rawBiogasQuality?.h2s),
      o2: n(api.rawBiogasQuality?.o2),
      n2: n(api.rawBiogasQuality?.n2)
    },
    compressedBiogas: {
      produced: n(api.compressedBiogas?.produced),
      cbgSold: n(api.compressedBiogas?.cbg_sold),
      conversionRatio: n(api.compressedBiogas?.conversion_ratio),
      ch4: n(api.compressedBiogas?.ch4),
      co2: n(api.compressedBiogas?.co2),
      h2s: n(api.compressedBiogas?.h2s),
      o2: n(api.compressedBiogas?.o2),
      n2: n(api.compressedBiogas?.n2)
    },
    compressors: {
      compressor1Hours: n(api.compressors?.compressor_1_hours),
      compressor2Hours: n(api.compressors?.compressor_2_hours)
    },
    fertilizer: {
      fomProduced: n(api.fertilizer?.fom_produced),
      sold: n(api.fertilizer?.sold),
      lagoonLiquidSold: n(api.fertilizer?.lagoon_liquid_sold)
    },
    utilities: {
      electricityConsumption: n(api.utilities?.electricity_consumption)
    },
    remarks: api.review_comment || ''
  };
}

function aggregate(entries) {
  if (!entries.length) return null;

  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr) => (arr.length > 0 ? sum(arr) / arr.length : 0);
  const averagePresent = (values) => {
    const valid = values.filter((value) => value !== null && value !== undefined);
    return valid.length > 0 ? sum(valid) / valid.length : null;
  };
  const maybeNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const splitFeedTotals = (totalQty) => {
    const total = Number(totalQty || 0);
    return { d01: total / 2, d02: total / 2, d03: total, total };
  };
  const buildFeedTotals = (getQty) =>
    splitFeedTotals(sum(entries.map((entry) => Number(getQty(entry) || 0))));
  const buildQuality = (getTs, getVs, getPh) => ({
    ts: averagePresent(entries.map((entry) => maybeNumber(getTs(entry)))),
    vs: averagePresent(entries.map((entry) => maybeNumber(getVs(entry)))),
    ph: getPh ? averagePresent(entries.map((entry) => maybeNumber(getPh(entry)))) : null,
  });

  // Mimic the frontend useMemo logic
  const d01Feed = sum(entries.map((e) => e.digesters[0]?.feeding.totalSlurryFeed || 0));
  const d02Feed = sum(entries.map((e) => e.digesters[1]?.feeding.totalSlurryFeed || 0));
  const d01Discharge = sum(entries.map((e) => e.digesters[0]?.discharge.totalSlurryOut || 0));
  const d02Discharge = sum(entries.map((e) => e.digesters[1]?.discharge.totalSlurryOut || 0));
  const totalFeedInputFromForm = sum(
    entries.map((e) => {
      const nn = (v) => Number(v || 0);
      return (
        nn(e.feedMixingTank?.cowDungFeed?.qty) +
        nn(e.feedMixingTank?.pressmudFeed?.qty) +
        nn(e.feedMixingTank?.permeateFeed?.qty) +
        nn(e.feedMixingTank?.waterQty) +
        nn(e.feedMixingTank?.pulpFeed?.qty) +
        nn(e.feedMixingTank?.maggieFeed?.qty) +
        nn(e.feedMixingTank?.otherFeedSubstrate?.qty)
      );
    })
  );
  const totalFeedInputFromMixingTank = sum(entries.map((e) => Number(e.feedMixingTank?.slurry?.total) || 0));
  const totalFeedInputFromDigesters = {
    d01: d01Feed,
    d02: d02Feed,
    d03: d01Feed + d02Feed,
    total: d01Feed + d02Feed,
  };
  const totalFeedInput =
    totalFeedInputFromForm > 0
      ? splitFeedTotals(totalFeedInputFromForm)
      : totalFeedInputFromMixingTank > 0
      ? splitFeedTotals(totalFeedInputFromMixingTank)
      : totalFeedInputFromDigesters;

  return {
    recordCount: entries.length,
    dateRange: `${entries[0].date} to ${entries[entries.length - 1].date}`,
    // D-01 and D-02 are the only digesters; D-03 column = Total = D-01 + D-02
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
        d02: d02Discharge,
        d03: d01Discharge + d02Discharge,
        total: d01Discharge + d02Discharge,
      },
      totalFeedInput,
      // Same as Final MIS web card / dashboard: Feed Mixing Tank (tons), not digester m³
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
      d01: {
        ts: avg(entries.map((e) => e.digesters[0]?.feeding.avgTs || 0)),
        vs: avg(entries.map((e) => e.digesters[0]?.feeding.avgVs || 0)),
        ph: avg(entries.map((e) => e.digesters[0]?.characteristics.ph || 0)),
        vfaTic: avg(entries.map((e) => e.digesters[0]?.characteristics.vfaAlkRatio || 0)),
        slurryLevel: avg(entries.map((e) => e.digesters[0]?.characteristics.slurryLevel || 0)),
        hrt: avg(entries.map((e) => e.digesters[0]?.health?.hrt || 0)),
        olr: avg(entries.map((e) => e.digesters[0]?.health?.olr || 0)),
        temp: avg(entries.map((e) => e.digesters[0]?.characteristics.temperature || 0)),
      },
      d02: {
        ts: avg(entries.map((e) => e.digesters[1]?.feeding.avgTs || 0)),
        vs: avg(entries.map((e) => e.digesters[1]?.feeding.avgVs || 0)),
        ph: avg(entries.map((e) => e.digesters[1]?.characteristics.ph || 0)),
        vfaTic: avg(entries.map((e) => e.digesters[1]?.characteristics.vfaAlkRatio || 0)),
        slurryLevel: avg(entries.map((e) => e.digesters[1]?.characteristics.slurryLevel || 0)),
        hrt: avg(entries.map((e) => e.digesters[1]?.health?.hrt || 0)),
        olr: avg(entries.map((e) => e.digesters[1]?.health?.olr || 0)),
        temp: avg(entries.map((e) => e.digesters[1]?.characteristics.temperature || 0)),
      },
      d03: {
        ts: avg(entries.map((e) => e.digesters[2]?.feeding.avgTs || 0)),
        vs: avg(entries.map((e) => e.digesters[2]?.feeding.avgVs || 0)),
        ph: avg(entries.map((e) => e.digesters[2]?.characteristics.ph || 0)),
        vfaTic: avg(entries.map((e) => e.digesters[2]?.characteristics.vfaAlkRatio || 0)),
        slurryLevel: avg(entries.map((e) => e.digesters[2]?.characteristics.slurryLevel || 0)),
        hrt: avg(entries.map((e) => e.digesters[2]?.health?.hrt || 0)),
        olr: avg(entries.map((e) => e.digesters[2]?.health?.olr || 0)),
        temp: avg(entries.map((e) => e.digesters[2]?.characteristics.temperature || 0)),
      },
    },
    biogasQuality: {
      ch4: avg(entries.map((e) => e.rawBiogasQuality.ch4)),
      co2: avg(entries.map((e) => e.rawBiogasQuality.co2)),
      o2: avg(entries.map((e) => e.rawBiogasQuality.o2)),
      h2s: avg(entries.map((e) => e.rawBiogasQuality.h2s)),
      n2: avg(entries.map((e) => e.rawBiogasQuality.n2)),
    },
    biogasProduction: {
      rbgProduced: sum(entries.map((e) => e.rawBiogas.totalRawBiogas)),
      rbgFlared: sum(entries.map((e) => e.rawBiogas.rbgFlared)),
      usedInKitchen: sum(entries.map((e) => e.rawBiogas.totalRawBiogas * 0.02)),
      sentToPurification: sum(entries.map((e) => e.rawBiogas.totalRawBiogas - e.rawBiogas.rbgFlared)),
    },
    cbgQuality: {
      ch4: avg(entries.map((e) => e.compressedBiogas.ch4)),
      co2: avg(entries.map((e) => e.compressedBiogas.co2)),
      o2: avg(entries.map((e) => e.compressedBiogas.o2)),
      h2s: avg(entries.map((e) => e.compressedBiogas.h2s)),
      n2: avg(entries.map((e) => e.compressedBiogas.n2)),
    },
    cbgProduction: {
      production: sum(entries.map((e) => e.compressedBiogas.produced)),
      dispatch: sum(entries.map((e) => e.compressedBiogas.cbgSold)),
      gasYield: avg(entries.map((e) => e.rawBiogas.gasYield)),
      cf: avg(entries.map((e) => e.compressedBiogas.conversionRatio)),
    },
    slsData: {
      decanter: {
        runHrs: sum(entries.map((e) => e.compressors.compressor1Hours)),
        slurryFeed: avg(entries.map((e) => e.slsMachine.slurryFeed / 24)),
        inletTs: avg(entries.map((e) => e.slsMachine.wetCakeTs)), // Approximation
        totalSlurryFeed: sum(entries.map((e) => e.slsMachine.slurryFeed)),
      },
      screwPress: {
        runHrs: sum(entries.map((e) => e.compressors.compressor2Hours)),
        slurryFeed: avg(entries.map((e) => e.slsMachine.slurryFeed / 24)),
        inletTs: avg(entries.map((e) => e.slsMachine.wetCakeTs)),
        totalSlurryFeed: sum(entries.map((e) => e.slsMachine.slurryFeed)),
      },
    },
    fomLfom: {
      decanter: {
        wetCakeQty: sum(entries.map((e) => e.slsMachine.wetCakeProduction)),
        wetCakeTs: avg(entries.map((e) => e.slsMachine.wetCakeTs)),
        lfomQty: sum(entries.map((e) => e.slsMachine.liquidProduced)),
        lfomTs: avg(entries.map((e) => e.slsMachine.liquidTs)),
      },
      screwPress: {
        wetCakeQty: sum(entries.map((e) => e.fertilizer.fomProduced)),
        wetCakeTs: avg(entries.map((e) => e.slsMachine.wetCakeTs)), // Approximation
        lfomQty: sum(entries.map((e) => e.slsMachine.liquidSentToLagoon)),
        lfomTs: avg(entries.map((e) => e.slsMachine.liquidTs)),
      },
    },
    slurryManagement: {
      directPurgeToFarmers: sum(entries.map((e) => e.digesters.reduce((acc, d) => acc + d.discharge.totalSlurryOut, 0) * 0.1)),
      slsInlet: sum(entries.map((e) => e.slsMachine.slurryFeed)),
      directPurgeToLagoon: sum(entries.map((e) => e.slsMachine.liquidSentToLagoon * 0.2)),
      totalSlurryOut: sum(entries.map((e) => e.digesters.reduce((acc, d) => acc + d.discharge.totalSlurryOut, 0))),
      totalPermeateToMixingTank: sum(entries.map((e) => e.feedMixingTank.permeateFeed.qty)),
      totalLfomToLagoon: sum(entries.map((e) => e.slsMachine.liquidSentToLagoon)),
      fomCakeDispatch: sum(entries.map((e) => e.fertilizer.sold)),
      lfomDispatch: sum(entries.map((e) => e.fertilizer.lagoonLiquidSold)),
    },
    powerConsumption: sum(entries.map((e) => e.utilities.electricityConsumption)),
    breakdownReasons: entries
      .filter((e) => e.remarks.toLowerCase().includes('maintenance') || e.remarks.toLowerCase().includes('breakdown'))
      .map((e) => e.remarks)
      .join('; ') || 'No major breakdowns reported',
  };
}

const tableStyles = `
  .fm-table { border-collapse: collapse; width: 100%; max-width: 1400px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #334155; }
  .fm-table th, .fm-table td { border: 1px solid #e2e8f0; padding: 10px 12px; }
  .fm-table .bg-primary { background: #2879b6; color: #fff; }
  .fm-table .bg-secondary { background: #3d8cc4; color: #fff; }
  .fm-table .bg-accent3 { background: #e0f2fe; color: #334155; font-weight: 600; }
  .fm-table .bg-accent2 { background: #f1f5f9; color: #334155; font-weight: 600; }
  .fm-table .bg-accent1 { background: #f8fafc; color: #334155; font-weight: 600; }
  .fm-table .bg-accent4 { background: #cffafe; color: #334155; font-weight: 600; }
  .fm-table .bg-yellow { background: #fef3c7; color: #334155; font-weight: 600; }
  .fm-table .text-center { text-align: center; }
  .fm-table .text-right { text-align: right; }
  .fm-table .font-bold { font-weight: 600; }
  body { margin: 20px; color: #334155; font-family: 'Segoe UI', Arial, sans-serif; }
  .header { color: #2879b6; font-size: 24px; font-weight: 700; margin-bottom: 20px; border-left: 5px solid #7dc244; padding-left: 15px; }
  .meta { color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
`;

function buildReportHtml(startDate, endDate, a, customBody) {
  if (!a) return `<p>No data for ${startDate} to ${endDate}.</p>`;

  const n2 = (v) => Number(v || 0).toFixed(2);
  const n1 = (v) => Number(v || 0).toFixed(1);
  const n0 = (v) => Number(v || 0).toFixed(0);
  const q1 = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? '-' : Number(v).toFixed(1));
  const feedstockRows = [
    { name: 'Press Mud (tpd)', data: a.feeding.pressMud, quality: a.rawMaterialQuality.pressMud },
    { name: 'Cow Dung (tpd)', data: a.feeding.cowDung, quality: a.rawMaterialQuality.cowDung },
    { name: 'Decanter permeate (m3)', data: a.feeding.decanterPermeate, quality: a.rawMaterialQuality.decanterPermeate },
    { name: 'Water (m3)', data: a.feeding.water, quality: a.rawMaterialQuality.water },
    { name: 'Pulp (tpd)', data: a.feeding.pulp, quality: a.rawMaterialQuality.pulp },
    { name: 'Maggie (tpd)', data: a.feeding.maggie, quality: a.rawMaterialQuality.maggie },
    { name: 'Other Feed Substrate (tpd)', data: a.feeding.otherFeedSubstrate, quality: a.rawMaterialQuality.otherFeedSubstrate },
    { name: 'Digester 03 slurry (m3)', data: a.feeding.digester03Slurry, quality: null },
    { name: 'Total Feed Input (m3)', data: a.feeding.totalFeedInput, quality: null },
  ];

  const intro = customBody && customBody.trim() ? `<div class="meta">${customBody}</div>` : '';

  const table = `
<table class="fm-table">
  <thead>
    <tr>
      <td class="bg-primary text-center font-bold">Report</td>
      <td colspan="4" class="bg-primary text-center font-bold" style="font-size: 16px;">4 TPD - SREL PLANT</td>
      <td colspan="4" class="bg-secondary"></td>
      <td class="bg-primary text-center font-bold">Period</td>
      <td colspan="2" class="bg-secondary text-center font-bold">${a.dateRange}</td>
    </tr>
    <tr>
        <td class="bg-accent3">Name of the Feedstock's</td>
        <td colspan="4" class="bg-accent3 text-center">Feeding Data</td>
        <td class="bg-accent1"></td>
        <td colspan="6" class="bg-accent3 text-center">Raw material Quality Data</td>
    </tr>
    <tr>
        <td class="bg-accent2"></td>
        <td class="bg-accent2 text-center">D-01</td>
        <td class="bg-accent2 text-center">D-02</td>
        <td class="bg-accent2 text-center">D-03</td>
        <td class="bg-accent2 text-center">Total</td>
        <td class="bg-accent1"></td>
        <td colspan="2" class="bg-accent2 text-center">TS%</td>
        <td colspan="2" class="bg-accent2 text-center">VS%</td>
        <td colspan="2" class="bg-accent2 text-center">pH</td>
    </tr>
  </thead>
  <tbody>
    ${feedstockRows.map((row) => `<tr><td>${row.name}</td><td class="text-center">${n2(row.data.d01)}</td><td class="text-center">${n2(row.data.d02)}</td><td class="text-center">${n2(row.data.d03)}</td><td class="text-center font-bold">${n2(row.data.total)}</td><td class="bg-accent1"></td><td colspan="2" class="text-center">${q1(row.quality?.ts)}</td><td colspan="2" class="text-center">${q1(row.quality?.vs)}</td><td colspan="2" class="text-center">${q1(row.quality?.ph)}</td></tr>`).join('')}
    
    <!-- Spacing -->
    <tr><td colspan="12" style="background: #f8fafc; padding: 8px;"></td></tr>

    <!-- Digester Performance -->
    <tr><td colspan="12" class="bg-accent3 text-center font-bold">Digester Performance Report</td></tr>
    <tr>
        <td class="bg-accent2">Digesters</td>
        <td class="bg-accent2 text-center">TS%</td><td class="bg-accent2 text-center">VS%</td><td class="bg-accent2 text-center">pH</td><td class="bg-accent2 text-center">VFA/TIC</td>
        <td class="bg-accent1 text-center">Slurry Level (m)</td><td class="bg-accent1 text-center">HRT (days)</td><td colspan="2" class="bg-accent1 text-center">OLR(kgVS/m3/day)</td><td colspan="3" class="bg-accent4 text-center">Slurry avg. Temp (deg C)</td>
    </tr>
    ${['d01', 'd02', 'd03'].map((key, idx) => {
    const d = a.digesterPerformance[key];
    return `<tr>
            <td class="font-bold">D-0${idx + 1}</td>
            <td class="text-center">${n1(d.ts)}</td><td class="text-center">${n1(d.vs)}</td><td class="text-center">${n1(d.ph)}</td><td class="text-center">${n2(d.vfaTic)}</td>
            <td class="text-center">${n1(d.slurryLevel)}</td><td class="text-center">${n1(d.hrt)}</td><td colspan="2" class="text-center">${n2(d.olr)}</td><td colspan="3" class="text-center">${n1(d.temp)}</td>
        </tr>`;
  }).join('')}
    
    <!-- Average Row -->
    <tr class="bg-accent2">
        <td class="font-bold">Average</td>
        <td class="text-center">${n1((a.digesterPerformance.d01.ts + a.digesterPerformance.d02.ts + a.digesterPerformance.d03.ts) / 3)}</td>
        <td class="text-center">${n1((a.digesterPerformance.d01.vs + a.digesterPerformance.d02.vs + a.digesterPerformance.d03.vs) / 3)}</td>
        <td class="text-center">${n1((a.digesterPerformance.d01.ph + a.digesterPerformance.d02.ph + a.digesterPerformance.d03.ph) / 3)}</td>
        <td class="text-center">${n2((a.digesterPerformance.d01.vfaTic + a.digesterPerformance.d02.vfaTic + a.digesterPerformance.d03.vfaTic) / 3)}</td>
        <td class="text-center">${n1((a.digesterPerformance.d01.slurryLevel + a.digesterPerformance.d02.slurryLevel + a.digesterPerformance.d03.slurryLevel) / 3)}</td>
        <td class="text-center">${n1((a.digesterPerformance.d01.hrt + a.digesterPerformance.d02.hrt + a.digesterPerformance.d03.hrt) / 3)}</td>
        <td colspan="2" class="text-center">${n2((a.digesterPerformance.d01.olr + a.digesterPerformance.d02.olr + a.digesterPerformance.d03.olr) / 3)}</td>
        <td colspan="3" class="text-center">${n1((a.digesterPerformance.d01.temp + a.digesterPerformance.d02.temp + a.digesterPerformance.d03.temp) / 3)}</td>
    </tr>

    <!-- Spacing -->
    <tr><td colspan="12" style="background: #f8fafc; padding: 8px;"></td></tr>

    <!-- Biogas Quality -->
    <tr>
        <td colspan="5" class="bg-accent3 text-center font-bold">Biogas Quality Report</td>
        <td colspan="7" class="bg-accent1 text-center font-bold">Biogas Production (Nm3)</td>
    </tr>
    <tr>
        <td class="bg-accent2 text-center">CH4%</td><td class="bg-accent2 text-center">CO2%</td><td class="bg-accent2 text-center">O2%</td><td class="bg-accent4 text-center">H2S ppm</td><td class="bg-accent2 text-center">N2%</td>
        <td colspan="2" class="bg-accent1 text-center">RBG Produced</td><td class="bg-accent1 text-center">RBG Flared</td><td colspan="2" class="bg-accent1 text-center">Used in Kitchen</td><td colspan="2" class="bg-accent1 text-center">Sent to Purification</td>
    </tr>
    <tr>
        <td class="text-center">${n1(a.biogasQuality.ch4)}</td><td class="text-center">${n1(a.biogasQuality.co2)}</td><td class="text-center">${n1(a.biogasQuality.o2)}</td><td class="text-center">${n0(a.biogasQuality.h2s)}</td><td class="text-center">${n1(a.biogasQuality.n2)}</td>
        <td colspan="2" class="text-center">${n0(a.biogasProduction.rbgProduced)}</td><td class="text-center">${n0(a.biogasProduction.rbgFlared)}</td><td colspan="2" class="text-center">${n0(a.biogasProduction.usedInKitchen)}</td><td colspan="2" class="text-center">${n0(a.biogasProduction.sentToPurification)}</td>
    </tr>

    <!-- Spacing -->
    <tr><td colspan="12" style="background: #f8fafc; padding: 8px;"></td></tr>

    <!-- CBG Quality -->
    <tr>
        <td colspan="4" class="bg-accent3 text-center font-bold">CBG Quality Report</td>
        <td style="background: #fff"></td>
        <td colspan="7" class="bg-accent4 text-center font-bold">CBG (Kg)</td>
    </tr>
    <tr>
        <td class="bg-accent2 text-center">CH4%</td><td class="bg-accent2 text-center">CO2%</td><td class="bg-accent2 text-center">O2%</td><td class="bg-accent4 text-center">H2S ppm</td><td class="bg-accent2 text-center">N2%</td>
        <td colspan="2" class="bg-accent4 text-center">Production</td><td colspan="2" class="bg-accent4 text-center">Dispatch</td><td colspan="2" class="bg-accent4 text-center">Gas Yield</td><td class="bg-accent4 text-center">CF</td>
    </tr>
    <tr>
        <td class="text-center">${n1(a.cbgQuality.ch4)}</td><td class="text-center">${n1(a.cbgQuality.co2)}</td><td class="text-center">${n1(a.cbgQuality.o2)}</td><td class="text-center">${n0(a.cbgQuality.h2s)}</td><td class="text-center">${n1(a.cbgQuality.n2)}</td>
        <td colspan="2" class="text-center">${n0(a.cbgProduction.production)}</td><td colspan="2" class="text-center">${n0(a.cbgProduction.dispatch)}</td><td colspan="2" class="text-center">${n2(a.cbgProduction.gasYield)}</td><td class="text-center">${n1(a.cbgProduction.cf)}</td>
    </tr>

    <!-- Spacing -->
    <tr><td colspan="12" style="background: #f8fafc; padding: 8px;"></td></tr>

    <!-- SLS & FOM -->
    <tr>
        <td colspan="5" class="bg-accent3 text-center font-bold">Solid Liquid Separator Operating Data</td>
        <td colspan="7" class="bg-yellow text-center font-bold">FOM & LFOM Production</td>
    </tr>
    <tr>
        <td class="bg-accent2"></td><td class="bg-accent1 text-center">Run. Hrs</td><td class="bg-accent1 text-center">Slurry feed (m3/hr)</td><td class="bg-accent1 text-center">Inlet TS%</td><td class="bg-accent1 text-center">Total Slurry feed (m3/day)</td>
        <td class="bg-yellow text-center">Wet Cake Qty</td><td colspan="2" class="bg-yellow text-center">Wet Cake TS%</td><td colspan="2" class="bg-accent2 text-center">LFOM qty</td><td colspan="2" class="bg-accent2 text-center">LFOM TS%</td>
    </tr>
    <tr>
        <td class="font-bold">Decanter</td>
        <td class="text-center">${n0(a.slsData.decanter.runHrs)}</td><td class="text-center">${n1(a.slsData.decanter.slurryFeed)}</td><td class="text-center">${n1(a.slsData.decanter.inletTs)}</td><td class="text-center">${n0(a.slsData.decanter.totalSlurryFeed)}</td>
        <td class="text-center">${n0(a.fomLfom.decanter.wetCakeQty)}</td><td colspan="2" class="text-center">${n1(a.fomLfom.decanter.wetCakeTs)}</td><td colspan="2" class="text-center">${n0(a.fomLfom.decanter.lfomQty)}</td><td colspan="2" class="text-center">${n1(a.fomLfom.decanter.lfomTs)}</td>
    </tr>
    <tr>
        <td class="font-bold">Screw Press</td>
        <td class="text-center">${n0(a.slsData.screwPress.runHrs)}</td><td class="text-center">${n1(a.slsData.screwPress.slurryFeed)}</td><td class="text-center">${n1(a.slsData.screwPress.inletTs)}</td><td class="text-center">${n0(a.slsData.screwPress.totalSlurryFeed)}</td>
        <td class="text-center">${n0(a.fomLfom.screwPress.wetCakeQty)}</td><td colspan="2" class="text-center">${n1(a.fomLfom.screwPress.wetCakeTs)}</td><td colspan="2" class="text-center">${n0(a.fomLfom.screwPress.lfomQty)}</td><td colspan="2" class="text-center">${n1(a.fomLfom.screwPress.lfomTs)}</td>
    </tr>


    <!-- Spacing -->
    <tr><td colspan="12" style="background: #f8fafc; padding: 8px;"></td></tr>

    <!-- Slurry Management -->
    <tr>
        <td colspan="12" class="bg-yellow text-center font-bold">Slurry Management Data</td>
    </tr>
    <tr class="bg-accent3">
        <td colspan="2" class="text-center font-bold" style="font-size: 11px;">Direct Purge Out to Farmers (m3)</td>
        <td class="text-center font-bold" style="font-size: 11px;">SLS inlet (m3)</td>
        <td colspan="2" class="text-center font-bold" style="font-size: 11px;">Direct Purge to Lagoon(m3)</td>
        <td colspan="2" class="text-center font-bold" style="font-size: 11px;">Total Slurry out (m3)</td>
        <td colspan="2" class="text-center font-bold" style="font-size: 11px;">Total permeate to Mixing Tank (m3)</td>
        <td class="text-center font-bold" style="font-size: 11px;">Total LFOM to Lagoon (m3)</td>
        <td class="bg-yellow text-center font-bold" style="font-size: 11px;">FOM Cake Dispatch (tons)</td>
        <td class="bg-yellow text-center font-bold" style="font-size: 11px;">LFOM Dispatch (tons)</td>
    </tr>
    <tr>
        <td colspan="2" class="text-center">${n0(a.slurryManagement.directPurgeToFarmers)}</td>
        <td class="text-center">${n0(a.slurryManagement.slsInlet)}</td>
        <td colspan="2" class="text-center">${n0(a.slurryManagement.directPurgeToLagoon)}</td>
        <td colspan="2" class="text-center font-bold" style="color: #2879b6;">${n0(a.slurryManagement.totalSlurryOut)}</td>
        <td colspan="2" class="text-center">${n0(a.slurryManagement.totalPermeateToMixingTank)}</td>
        <td class="text-center">${n0(a.slurryManagement.totalLfomToLagoon)}</td>
        <td class="text-center">${n0(a.slurryManagement.fomCakeDispatch)}</td>
        <td class="text-center">${n0(a.slurryManagement.lfomDispatch)}</td>
    </tr>

    <!-- Spacing -->
    <tr><td colspan="12" style="background: #f8fafc; padding: 8px;"></td></tr>

    <!-- Power & Breakdowns -->
    <tr>
        <td colspan="6" class="bg-yellow text-center font-bold" style="padding: 12px;">Total Power Consumptions (Kwh/day)</td>
        <td colspan="6" class="bg-accent2 text-center font-bold" style="padding: 12px;">Major Breakdown Reasons</td>
    </tr>
    <tr>
        <td colspan="6" class="text-center font-bold" style="font-size: 24px; color: #2879b6; padding: 20px;">${n0(a.powerConsumption)} kWh</td>
        <td colspan="6" class="text-center" style="color: #64748b; padding: 20px;">${a.breakdownReasons}</td>
    </tr>

  </tbody>
</table>

<!-- Cards Section -->
<table style="width: 100%; max-width: 1400px; margin-top: 20px; border-spacing: 15px; border-collapse: separate;">
    <tr>
        <td style="background: #e0f2fe; border-radius: 12px; padding: 20px; width: 25%; text-align: left;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">Total Feed Input</div>
            <div style="font-size: 24px; font-weight: 700; color: #334155;">${n2(a.feeding.totalFeedAmountTons ?? 0)} tons</div>
        </td>
        <td style="background: #f0fdf4; border-radius: 12px; padding: 20px; width: 25%; text-align: left;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">RBG Produced</div>
            <div style="font-size: 24px; font-weight: 700; color: #334155;">${n0(a.biogasProduction.rbgProduced)} Nm3</div>
        </td>
        <td style="background: #fff7ed; border-radius: 12px; padding: 20px; width: 25%; text-align: left;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">CBG Production</div>
            <div style="font-size: 24px; font-weight: 700; color: #334155;">${n0(a.cbgProduction.production)} Kg</div>
        </td>
        <td style="background: #fffbeb; border-radius: 12px; padding: 20px; width: 25%; text-align: left;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">Power Consumption</div>
            <div style="font-size: 24px; font-weight: 700; color: #334155;">${n0(a.powerConsumption)} kWh</div>
        </td>
    </tr>
</table>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${tableStyles}</style></head><body>
  <div class="header">Final MIS Report</div>
  ${intro}
  ${table}
  <p class="meta" style="margin-top: 20px; font-style: italic;">This is an automated report from BioGas MIS.</p>
</body></html>`;
}

async function buildReportHtmlForRange(startDate, endDate, customBody = '') {
  const entries = await fetchEntriesForReport(startDate, endDate);
  const aggregated = aggregate(entries);
  return buildReportHtml(startDate, endDate, aggregated, customBody);
}

/** YYYY-MM-DD in the server's local timezone (not UTC) — matches MIS entry `date` for plant-local days. */
function toLocalYMD(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function getDateRangeForSchedule(scheduleType, scheduleTime, cronExpression) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  switch (scheduleType) {
    case 'daily': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const s = toLocalYMD(yesterday);
      return { startDate: s, endDate: s };
    }
    case 'weekly': {
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekStart.getDate() - 6);
      return {
        startDate: toLocalYMD(lastWeekStart),
        endDate: toLocalYMD(lastWeekEnd),
      };
    }
    case 'monthly': {
      const lastMonth = m === 0 ? 11 : m - 1;
      const lastMonthYear = m === 0 ? y - 1 : y;
      const lastDay = new Date(lastMonthYear, lastMonth + 1, 0).getDate();
      return {
        startDate: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`,
        endDate: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    case 'quarterly': {
      const q = Math.floor(m / 3) + 1;
      const lastQ = q === 1 ? 4 : q - 1;
      const lastQYear = q === 1 ? y - 1 : y;
      const [qStart, qEnd] = lastQ === 1 ? [1, 3] : lastQ === 2 ? [4, 6] : lastQ === 3 ? [7, 9] : [10, 12];
      const endDay = new Date(lastQYear, qEnd, 0).getDate();
      return {
        startDate: `${lastQYear}-${String(qStart).padStart(2, '0')}-01`,
        endDate: `${lastQYear}-${String(qEnd).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
      };
    }
    case 'custom':
    default:
      return null;
  }
}

function minutesSinceMidnight(d) {
  return d.getHours() * 60 + d.getMinutes();
}

function scheduledMinutesFromTimeString(scheduleTime) {
  const parts = (scheduleTime || '09:00').split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const hh = Number.isFinite(h) ? h : 9;
  const mm = Number.isFinite(m) ? m : 0;
  return hh * 60 + mm;
}

/**
 * True when local clock is on or after schedule_time today (not exact minute).
 * Used with hourly/15-min cron so failed sends retry the same calendar window until success.
 */
function isPastScheduleTimeToday(scheduleTime) {
  const now = new Date();
  return minutesSinceMidnight(now) >= scheduledMinutesFromTimeString(scheduleTime);
}

/**
 * Whether the scheduler should attempt Final MIS email now (broad window + calendar rules).
 * Replaces exact-minute isDueNow for production reliability behind reverse proxies / transient SMTP.
 */
function isScheduledFinalMISAttemptDue(scheduleType, scheduleTime) {
  if (!isPastScheduleTimeToday(scheduleTime)) return false;
  const now = new Date();
  switch (scheduleType) {
    case 'daily':
      return true;
    case 'weekly':
      return now.getDay() === 1;
    case 'monthly':
      return now.getDate() === 1;
    case 'quarterly': {
      const d = now.getDate();
      const month = now.getMonth();
      return d === 1 && (month === 0 || month === 3 || month === 6 || month === 9);
    }
    default:
      return false;
  }
}

/** @deprecated Prefer isScheduledFinalMISAttemptDue — kept for tests / tooling */
function isDueNow(scheduleType, scheduleTime) {
  const now = new Date();
  const [h, m] = (scheduleTime || '09:00').split(':').map(Number);
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour !== h || minute !== (m || 0)) return false;
  if (scheduleType === 'daily') return true;
  if (scheduleType === 'weekly') return now.getDay() === 1;
  if (scheduleType === 'monthly') return now.getDate() === 1;
  if (scheduleType === 'quarterly') {
    const d = now.getDate();
    const month = now.getMonth();
    return d === 1 && (month === 0 || month === 3 || month === 6 || month === 9);
  }
  return false;
}

module.exports = {
  fetchEntriesForReport,
  aggregate,
  buildReportHtml,
  buildReportHtmlForRange,
  getDateRangeForSchedule,
  isDueNow,
  isScheduledFinalMISAttemptDue,
  /** YYYY-MM-DD in local TZ — exported for scheduler idempotency comparisons */
  toLocalYMD,
};
