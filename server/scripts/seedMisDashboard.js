/**
 * Seed MIS entries across weeks / months / years for dashboard testing.
 *
 * IMPORTANT: Inserts via Sequelize only — never calls submit/approve/reject.
 * No notification emails are sent by this script.
 *
 * Coverage (skips dates that already exist for shift=General):
 *   2024 — sample weeks in Mar / Jun / Sep / Dec
 *   2025 — ~every 3rd day, all months
 *   2026 — denser (every other day) Jan → current month
 *
 * Usage (from server folder):
 *   node scripts/seedMisDashboard.js
 *
 * Optional env:
 *   CREATED_BY_USER_ID=1
 *   SEED_REPLACE=1   // delete existing seeded dates first (audit_note starts with "Dashboard seed")
 */
const path = require('path');

process.env.SEED_NO_EMAIL = '1';

const serverRoot = path.resolve(__dirname, '..');
const {
  User,
  MISDailyEntry,
  MISRawMaterials,
  MISFeedMixingTank,
  MISDigesterData,
  MISSLSData,
  MISRawBiogas,
  MISRawBiogasQuality,
  MISCompressedBiogas,
  MISCompressors,
  MISFertilizerData,
  MISUtilities,
  MISManpowerData,
  MISPlantAvailability,
  MISHSEData,
  sequelize,
} = require(path.join(serverRoot, 'models'));

function pad(n) {
  return String(n).padStart(2, '0');
}

function dayKey(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Deterministic variation from date string */
function vary(base, dateStr, spread = 0.18) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i += 1) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  const seed = h % 31;
  const factor = 1 + (spread * (seed - 15) / 15);
  return Math.round(base * factor * 100) / 100;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/** Build the list of dates to seed */
function buildDateList() {
  const dates = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // 2024 — four representative weeks (Mon–Sun-ish spans)
  const weeks2024 = [
    { y: 2024, m: 3, start: 4, end: 10 },
    { y: 2024, m: 6, start: 10, end: 16 },
    { y: 2024, m: 9, start: 9, end: 15 },
    { y: 2024, m: 12, start: 2, end: 8 },
  ];
  weeks2024.forEach(({ y, m, start, end }) => {
    for (let d = start; d <= end; d += 1) dates.push(dayKey(y, m, d));
  });

  // 2025 — every 3rd day, all months
  for (let m = 1; m <= 12; m += 1) {
    const dim = daysInMonth(2025, m);
    for (let d = 1; d <= dim; d += 3) dates.push(dayKey(2025, m, d));
  }

  // 2026 — every other day from Jan through today (or full year if not 2026)
  const endYear = currentYear >= 2026 ? 2026 : 2026;
  const endMonth = currentYear === 2026 ? currentMonth : 12;
  for (let m = 1; m <= endMonth; m += 1) {
    const dim = daysInMonth(endYear, m);
    const lastDay = currentYear === 2026 && m === currentMonth ? currentDay : dim;
    for (let d = 1; d <= lastDay; d += 2) dates.push(dayKey(endYear, m, d));
  }

  // Always include a few consecutive days in current week for Daily/Weekly filters
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(dayKey(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  }

  return [...new Set(dates)].sort();
}

async function createEntryForDate(dateStr, createdBy, status) {
  const t = await sequelize.transaction();
  try {
    const existing = await MISDailyEntry.findOne({
      where: { date: dateStr, shift: 'General' },
      transaction: t,
    });
    if (existing) {
      await t.rollback();
      return 'skipped';
    }

    const entry = await MISDailyEntry.create({
      date: dateStr,
      shift: 'General',
      status,
      created_by: createdBy,
      review_comment: null,
    }, { transaction: t });
    const entryId = entry.id;

    // Seasonal + weekly profile so charts look distinct across filters
    const month = Number(dateStr.slice(5, 7));
    const seasonal = 1 + 0.08 * Math.sin(((month - 1) / 12) * Math.PI * 2);
    const rawBiogasTotal = vary(4200 * seasonal, dateStr);
    const cbgProduced = vary(1650 * seasonal, dateStr); // keep clearly below raw m³-equivalent visual
    const cbgSold = vary(1380 * seasonal, dateStr);

    await MISRawMaterials.create({
      entry_id: entryId,
      cow_dung_purchased: vary(12, dateStr),
      cow_dung_stock: vary(8, dateStr),
      old_press_mud_opening_balance: vary(5, dateStr),
      old_press_mud_purchased: vary(3, dateStr),
      old_press_mud_degradation_loss: vary(0.2, dateStr),
      old_press_mud_closing_stock: vary(4.5, dateStr),
      new_press_mud_purchased: vary(2, dateStr),
      press_mud_used: vary(6, dateStr),
      total_press_mud_stock: vary(10, dateStr),
      audit_note: `Dashboard seed ${dateStr}`,
    }, { transaction: t });

    await MISFeedMixingTank.create({
      entry_id: entryId,
      cow_dung_qty: vary(15, dateStr),
      cow_dung_ts: 8.5,
      cow_dung_vs: 65,
      pressmud_qty: vary(4, dateStr),
      pressmud_ts: 9,
      pressmud_vs: 60,
      permeate_qty: vary(2, dateStr),
      permeate_ts: 7,
      permeate_vs: 55,
      water_qty: vary(12, dateStr),
      slurry_total: vary(32, dateStr),
      slurry_ts: 8,
      slurry_vs: 62,
      slurry_ph: 7.2,
    }, { transaction: t });

    for (const name of ['Digester 01', 'Digester 02', 'Digester 03']) {
      await MISDigesterData.create({
        entry_id: entryId,
        digester_name: name,
        feeding_slurry: vary(10, dateStr),
        feeding_ts_percent: 8,
        feeding_vs_percent: 64,
        discharge_slurry: vary(9.5, dateStr),
        discharge_ts_percent: 8.2,
        discharge_vs_percent: 62,
        lignin: 12,
        vfa: 2.5,
        alkalinity: 4.2,
        vfa_alk_ratio: 0.6,
        ash: 18,
        density: 1.02,
        ph: 7.2,
        temp: 38,
        pressure: vary(1.05, dateStr, 0.05),
        slurry_level: vary(75, dateStr),
        hrt: 28,
        vs_destruction: 72,
        olr: 2.5,
        balloon_level: 80,
        agitator_condition: 'OK',
        foaming_level: 0,
      }, { transaction: t });
    }

    await MISSLSData.create({
      entry_id: entryId,
      water_consumption: vary(5, dateStr),
      poly_electrolyte: vary(12, dateStr),
      solution: vary(8, dateStr),
      slurry_feed: vary(25, dateStr),
      wet_cake_prod: vary(4.5, dateStr),
      wet_cake_ts: 28,
      wet_cake_vs: 70,
      liquid_produced: vary(18, dateStr),
      liquid_ts: 2,
      liquid_vs: 15,
      liquid_sent_to_lagoon: vary(16, dateStr),
    }, { transaction: t });

    await MISRawBiogas.create({
      entry_id: entryId,
      digester_01_gas: vary(1400 * seasonal, dateStr),
      digester_02_gas: vary(1420 * seasonal, dateStr),
      digester_03_gas: vary(1380 * seasonal, dateStr),
      total_raw_biogas: rawBiogasTotal,
      rbg_flared: vary(50, dateStr),
      gas_yield: vary(0.32, dateStr, 0.05),
    }, { transaction: t });

    await MISRawBiogasQuality.create({
      entry_id: entryId,
      ch4: 55,
      co2: 38,
      h2s: vary(80, dateStr, 0.1),
      o2: 0.5,
      n2: 6,
    }, { transaction: t });

    await MISCompressedBiogas.create({
      entry_id: entryId,
      produced: cbgProduced,
      ch4: 92,
      co2: 2,
      h2s: 5,
      o2: 0.2,
      n2: 0.8,
      conversion_ratio: vary(0.78, dateStr, 0.02),
      ch4_slippage: 2.5,
      cbg_stock: vary(120, dateStr),
      cbg_sold: cbgSold,
    }, { transaction: t });

    await MISCompressors.create({
      entry_id: entryId,
      compressor_1_hours: vary(20, dateStr),
      compressor_2_hours: vary(18, dateStr),
      total_hours: vary(38, dateStr),
    }, { transaction: t });

    await MISFertilizerData.create({
      entry_id: entryId,
      fom_produced: vary(320, dateStr),
      inventory: vary(800, dateStr),
      sold: vary(250, dateStr),
      weighted_average: 4.5,
      revenue_1: vary(12000, dateStr),
      lagoon_liquid_sold: vary(100, dateStr),
      revenue_2: vary(800, dateStr),
      loose_fom_sold: vary(50, dateStr),
      revenue_3: vary(2000, dateStr),
    }, { transaction: t });

    await MISUtilities.create({
      entry_id: entryId,
      electricity_consumption: vary(420, dateStr),
      specific_power_consumption: vary(0.49, dateStr, 0.05),
    }, { transaction: t });

    await MISManpowerData.create({
      entry_id: entryId,
      refex_srel_staff: 12,
      third_party_staff: 5,
    }, { transaction: t });

    await MISPlantAvailability.create({
      entry_id: entryId,
      working_hours: 24,
      scheduled_downtime: 0,
      unscheduled_downtime: vary(0.5, dateStr),
      total_availability: vary(98, dateStr, 0.04),
    }, { transaction: t });

    const dayNum = Number(dateStr.slice(8, 10));
    await MISHSEData.create({
      entry_id: entryId,
      safety_lti: 0,
      near_misses: dayNum % 11 === 0 ? 1 : 0,
      first_aid: 0,
      reportable_incidents: 0,
      mti: 0,
      other_incidents: 0,
      fatalities: 0,
    }, { transaction: t });

    await t.commit();
    return 'created';
  } catch (err) {
    await t.rollback();
    console.error(`Failed for ${dateStr}:`, err.message);
    return 'failed';
  }
}

async function run() {
  console.log('=== MIS Dashboard seed (NO EMAILS) ===');
  console.log('Inserts go straight to MySQL — submit/approve APIs are not used.\n');

  let createdBy = parseInt(process.env.CREATED_BY_USER_ID || '', 10);
  if (!createdBy) {
    const user = await User.findOne({ order: [['id', 'ASC']] });
    if (!user) {
      console.error('No user found. Create a user first, then re-run this script.');
      process.exit(1);
    }
    createdBy = user.id;
    console.log(`Using user #${createdBy} (${user.name || user.email || 'n/a'})`);
  }

  const dates = buildDateList();
  console.log(`Will attempt ${dates.length} dates spanning ${dates[0]} → ${dates[dates.length - 1]}`);

  const statuses = ['approved', 'approved', 'submitted', 'approved', 'draft'];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < dates.length; i += 1) {
    const dateStr = dates[i];
    const status = statuses[i % statuses.length];
    // Prefer approved so dashboard aggregations (if filtered) still show data —
    // current dashboard includes all statuses; approved is fine for realism.
    const result = await createEntryForDate(dateStr, createdBy, status === 'draft' && i % 17 === 0 ? 'draft' : 'approved');
    if (result === 'created') created += 1;
    else if (result === 'skipped') skipped += 1;
    else failed += 1;

    if ((i + 1) % 25 === 0 || i === dates.length - 1) {
      console.log(`  … ${i + 1}/${dates.length} (created ${created}, skipped ${skipped})`);
    }
  }

  console.log('\nDone.');
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped} (already existed)`);
  console.log(`  Failed  : ${failed}`);
  console.log('\nNo emails were sent. Refresh the Dashboard and try Daily / Weekly / Monthly / Quarterly / Yearly filters.');
  await sequelize.close();
  process.exit(failed ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  try { await sequelize.close(); } catch (_) { /* ignore */ }
  process.exit(1);
});
