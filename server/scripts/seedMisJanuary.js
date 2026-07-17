/**
 * Seed 31 MIS Entry records for January (1st to 31st).
 * Use for testing: Dashboard, MIS Entry CRUD list/filters, Final MIS Report.
 *
 * Usage (from server folder): node scripts/seedMisJanuary.js
 * Optional env: SEED_YEAR=2025 (default: previous year if current month > 1, else current year - 1)
 *               CREATED_BY_USER_ID=1 (default: first user in DB)
 */
const path = require('path');

// Use app's models and single sequelize connection (run from server folder)
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

// Slight variation per day (deterministic) so dashboard/report look realistic per day (deterministic from day number) so reports look realistic
function vary(base, day, spread = 0.15) {
  const seed = (day * 7) % 31;
  const factor = 1 + (spread * (seed - 15) / 15);
  return Math.round(base * factor * 100) / 100;
}

async function run() {
  const year = parseInt(process.env.SEED_YEAR || '', 10) || (() => {
    const d = new Date();
    return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  })();

  let createdBy = parseInt(process.env.CREATED_BY_USER_ID || '', 10);
  if (!createdBy) {
    const user = await User.findOne({ order: [['id', 'ASC']] });
    if (!user) {
      console.error('No user found. Create a user first (e.g. via signup) then run this script.');
      process.exit(1);
    }
    createdBy = user.id;
  }
  console.log(`Using created_by user id: ${createdBy}`);
  console.log(`Seeding 31 MIS entries for January ${year} (01 to 31)...`);

  const statuses = ['draft', 'submitted', 'approved', 'submitted', 'approved']; // mix for testing filters
  let created = 0;
  let skipped = 0;

  for (let day = 1; day <= 31; day++) {
    const dateStr = `${year}-01-${String(day).padStart(2, '0')}`;
    const t = await sequelize.transaction();
    try {
      const existing = await MISDailyEntry.findOne({
        where: { date: dateStr, shift: 'General' },
        transaction: t,
      });
      if (existing) {
        await t.rollback();
        skipped++;
        continue;
      }

      const status = statuses[day % statuses.length];
      const entry = await MISDailyEntry.create({
        date: dateStr,
        shift: 'General',
        status,
        created_by: createdBy,
        review_comment: null,
      }, { transaction: t });
      const entryId = entry.id;

      const rawBiogasTotal = vary(4200, day);
      const cbgProduced = vary(850, day);
      const cbgSold = vary(720, day);

      await MISRawMaterials.create({
        entry_id: entryId,
        cow_dung_purchased: vary(12, day),
        cow_dung_stock: vary(8, day),
        old_press_mud_opening_balance: vary(5, day),
        old_press_mud_purchased: vary(3, day),
        old_press_mud_degradation_loss: vary(0.2, day),
        old_press_mud_closing_stock: vary(4.5, day),
        new_press_mud_purchased: vary(2, day),
        press_mud_used: vary(6, day),
        total_press_mud_stock: vary(10, day),
        audit_note: `Seed data ${dateStr}`,
      }, { transaction: t });

      await MISFeedMixingTank.create({
        entry_id: entryId,
        cow_dung_qty: vary(15, day),
        cow_dung_ts: 8.5,
        cow_dung_vs: 65,
        pressmud_qty: vary(4, day),
        pressmud_ts: 9,
        pressmud_vs: 60,
        permeate_qty: vary(2, day),
        permeate_ts: 7,
        permeate_vs: 55,
        water_qty: vary(12, day),
        slurry_total: vary(32, day),
        slurry_ts: 8,
        slurry_vs: 62,
        slurry_ph: 7.2,
      }, { transaction: t });

      const digesterNames = ['Digester 01', 'Digester 02', 'Digester 03'];
      for (const name of digesterNames) {
        await MISDigesterData.create({
          entry_id: entryId,
          digester_name: name,
          feeding_slurry: vary(10, day),
          feeding_ts_percent: 8,
          feeding_vs_percent: 64,
          discharge_slurry: vary(9.5, day),
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
          pressure: vary(1.05, day, 0.05),
          slurry_level: vary(75, day),
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
        water_consumption: vary(5, day),
        poly_electrolyte: vary(12, day),
        solution: vary(8, day),
        slurry_feed: vary(25, day),
        wet_cake_prod: vary(4.5, day),
        wet_cake_ts: 28,
        wet_cake_vs: 70,
        liquid_produced: vary(18, day),
        liquid_ts: 2,
        liquid_vs: 15,
        liquid_sent_to_lagoon: vary(16, day),
      }, { transaction: t });

      await MISRawBiogas.create({
        entry_id: entryId,
        digester_01_gas: vary(1400, day),
        digester_02_gas: vary(1420, day),
        digester_03_gas: vary(1380, day),
        total_raw_biogas: rawBiogasTotal,
        rbg_flared: vary(50, day),
        gas_yield: vary(0.32, day, 0.05),
      }, { transaction: t });

      await MISRawBiogasQuality.create({
        entry_id: entryId,
        ch4: 55,
        co2: 38,
        h2s: vary(80, day, 0.1),
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
        conversion_ratio: vary(0.78, day, 0.02),
        ch4_slippage: 2.5,
        cbg_stock: vary(120, day),
        cbg_sold: cbgSold,
      }, { transaction: t });

      await MISCompressors.create({
        entry_id: entryId,
        compressor_1_hours: vary(20, day),
        compressor_2_hours: vary(18, day),
        total_hours: vary(38, day),
      }, { transaction: t });

      await MISFertilizerData.create({
        entry_id: entryId,
        fom_produced: vary(3.2, day),
        inventory: vary(8, day),
        sold: vary(2.5, day),
        weighted_average: 4.5,
        revenue_1: vary(12000, day),
        lagoon_liquid_sold: vary(1, day),
        revenue_2: vary(800, day),
        loose_fom_sold: vary(0.5, day),
        revenue_3: vary(2000, day),
      }, { transaction: t });

      await MISUtilities.create({
        entry_id: entryId,
        electricity_consumption: vary(420, day),
        specific_power_consumption: vary(0.49, day, 0.05),
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
        unscheduled_downtime: vary(0.5, day),
        total_availability: vary(98, day),
      }, { transaction: t });

      await MISHSEData.create({
        entry_id: entryId,
        safety_lti: 0,
        near_misses: day % 7 === 0 ? 1 : 0,
        first_aid: 0,
        reportable_incidents: 0,
        mti: 0,
        other_incidents: 0,
        fatalities: 0,
      }, { transaction: t });

      await t.commit();
      created++;
      if (day % 10 === 0) console.log(`  ... ${day}/31`);
    } catch (err) {
      await t.rollback();
      console.error(`Failed for ${dateStr}:`, err.message);
    }
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
