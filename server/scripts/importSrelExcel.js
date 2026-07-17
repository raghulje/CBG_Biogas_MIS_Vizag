/**
 * Import SREL MIS Excel (client/SREL MIS Jan-2026.xlsx) into MIS Entry records.
 * Reads date-wise data from sheet "SREL-Plant MIS" and creates one MIS entry per date.
 *
 * Sheet structure:
 * - Rows 2-11: Summary of Raw Materials (one Qty per metric); applied to first day only.
 * - Row 19+: Date (col 0 = Excel serial), Feed Mixing, Digester 1-3, SLS, Raw Biogas,
 *   CBG, Compressors, Fertilizer, Utilities, Manpower, Plant Availability, HSE.
 *
 * Run from server:
 *   node scripts/importSrelExcel.js              (use default user 1, skip existing dates)
 *   node scripts/importSrelExcel.js 1             (created_by = 1)
 *   node scripts/importSrelExcel.js --replace     (replace existing entries for dates in file)
 *   node scripts/importSrelExcel.js 1 --replace
 * Default createdByUserId: 1 (admin).
 * Skips dates that already have an entry unless --replace is used.
 */

const path = require('path');
const XLSX = require('xlsx');

const filePath = path.join(__dirname, '../../client/SREL MIS Jan-2026.xlsx');

// Parse args: first numeric arg = userId; --replace = replace existing
const argv = process.argv.slice(2);
const replaceExisting = argv.includes('--replace');
const userIdArg = argv.find((a) => a !== '--replace' && /^\d+$/.test(a));
const userId = userIdArg ? parseInt(userIdArg, 10) : 1;

function n(val) {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const s = String(val).trim();
  if (s === '' || s === '-' || s.toLowerCase() === 'n/a') return 0;
  const f = parseFloat(s.replace(/,/g, ''));
  return Number.isNaN(f) ? 0 : f;
}
function nInt(val) {
  return Math.round(n(val));
}

function excelSerialToDate(serial) {
  if (serial == null || typeof serial !== 'number') return null;
  const utc = (serial - 25569) * 86400 * 1000;
  const d = new Date(utc);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function run() {
  const db = require('../models');

  const {
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
    sequelize
  } = db;

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['SREL-Plant MIS'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Raw Materials summary: rows 2-11, col 8 = Qty (1=Cow Dung Purchased, 2=Cow Dung Stock, 3=Old Press Mud..., 4-10 other)
  const rawMaterialsSummary = {};
  const rmLabels = ['cow_dung_purchased', 'cow_dung_stock', 'old_press_mud_opening_balance', 'old_press_mud_purchased', 'old_press_mud_degradation_loss', 'old_press_mud_closing_stock', 'new_press_mud_purchased', 'press_mud_used', 'total_press_mud_stock'];
  for (let i = 0; i < Math.min(9, rmLabels.length); i++) {
    const row = rows[2 + i] || [];
    rawMaterialsSummary[rmLabels[i]] = n(row[8]); // Qty column
  }

  // Date-wise data: from row 19, col 0 = Excel date serial
  const DATA_START_ROW = 19;
  const results = { created: 0, skipped: 0, replaced: 0, errors: [] };
  if (replaceExisting) console.log('--replace: will replace existing entries for dates in file.');
  console.log('Using created_by user id:', userId);

  for (let r = DATA_START_ROW; r < rows.length; r++) {
    const row = rows[r] || [];
    const dateSerial = row[0];
    if (typeof dateSerial !== 'number' || dateSerial < 40000) break;

    const dateStr = excelSerialToDate(dateSerial);
    if (!dateStr) continue;

    const t = await sequelize.transaction();
    try {
      // Check if entry already exists for this date (unique date+shift)
      const existing = await MISDailyEntry.findOne({
        where: { date: dateStr, shift: 'General' }
      });
      if (existing) {
        if (!replaceExisting) {
          results.skipped++;
          await t.commit();
          continue;
        }
        await existing.destroy({ transaction: t });
        results.replaced++;
      }

      const entry = await MISDailyEntry.create({
        date: dateStr,
        shift: 'General',
        status: 'draft',
        created_by: userId
      }, { transaction: t });

      // Raw Materials (use summary for first day only to avoid duplicate totals; else zeros)
      const useRawSummary = r === DATA_START_ROW;
      await MISRawMaterials.create({
        entry_id: entry.id,
        cow_dung_purchased: useRawSummary ? rawMaterialsSummary.cow_dung_purchased : 0,
        cow_dung_stock: useRawSummary ? rawMaterialsSummary.cow_dung_stock : 0,
        old_press_mud_opening_balance: useRawSummary ? rawMaterialsSummary.old_press_mud_opening_balance : 0,
        old_press_mud_purchased: useRawSummary ? rawMaterialsSummary.old_press_mud_purchased : 0,
        old_press_mud_degradation_loss: useRawSummary ? rawMaterialsSummary.old_press_mud_degradation_loss : 0,
        old_press_mud_closing_stock: useRawSummary ? rawMaterialsSummary.old_press_mud_closing_stock : 0,
        new_press_mud_purchased: useRawSummary ? rawMaterialsSummary.new_press_mud_purchased : 0,
        press_mud_used: useRawSummary ? rawMaterialsSummary.press_mud_used : 0,
        total_press_mud_stock: useRawSummary ? rawMaterialsSummary.total_press_mud_stock : 0
      }, { transaction: t });

      // Feed Mixing Tank: col 1=CD Qty, 2=TS, 3=VS, 4=PM Qty, 5,6=TS,VS, 7,8,9=Permeate, 10=Water, 11=Total Slurry, 12,13,14=Slurry TS,VS,pH
      await MISFeedMixingTank.create({
        entry_id: entry.id,
        cow_dung_qty: n(row[1]),
        cow_dung_ts: n(row[2]),
        cow_dung_vs: n(row[3]),
        pressmud_qty: n(row[4]),
        pressmud_ts: n(row[5]),
        pressmud_vs: n(row[6]),
        permeate_qty: n(row[7]),
        permeate_ts: n(row[8]),
        permeate_vs: n(row[9]),
        water_qty: n(row[10]),
        slurry_total: n(row[11]),
        slurry_ts: n(row[12]),
        slurry_vs: n(row[13]),
        slurry_ph: n(row[14])
      }, { transaction: t });

      // Digester 1: 15-20 feed/out, 33-48 characteristics/health
      // Digester 2: 21-26 feed/out, 49-64
      // Digester 3: 27-32 feed/out, 65-80
      const digesterConfigs = [
        { name: 'Digester 01', feedStart: 15, healthStart: 33 },
        { name: 'Digester 02', feedStart: 21, healthStart: 49 },
        { name: 'Digester 03', feedStart: 27, healthStart: 65 }
      ];
      for (const cfg of digesterConfigs) {
        const feedIn = cfg.feedStart;
        const feedOut = feedIn + 3;
        const h = cfg.healthStart;
        await MISDigesterData.create({
          entry_id: entry.id,
          digester_name: cfg.name,
          feeding_slurry: n(row[feedIn]),
          feeding_ts_percent: n(row[feedIn + 1]),
          feeding_vs_percent: n(row[feedIn + 2]),
          discharge_slurry: n(row[feedOut]),
          discharge_ts_percent: n(row[feedOut + 1]),
          discharge_vs_percent: n(row[feedOut + 2]),
          lignin: n(row[h]),
          vfa: n(row[h + 1]),
          alkalinity: n(row[h + 2]),
          vfa_alk_ratio: n(row[h + 3]),
          ash: n(row[h + 4]),
          density: n(row[h + 5]),
          ph: n(row[h + 6]),
          temp: n(row[h + 7]),
          pressure: n(row[h + 8]),
          slurry_level: n(row[h + 9]),
          hrt: n(row[h + 10]),
          vs_destruction: n(row[h + 11]),
          olr: n(row[h + 12]),
          balloon_level: n(row[h + 13]),
          agitator_condition: row[h + 14] != null ? String(row[h + 14]).slice(0, 50) : null,
          foaming_level: n(row[h + 15])
        }, { transaction: t });
      }

      // SLS: 81=Water, 82=Poly, 83=Solution, 84=Slurry feed, 85=Wet Cake, 86,87=TS,VS, 88=Liquid produced, 89,90=TS,VS, 91=Liquid to lagoon
      await MISSLSData.create({
        entry_id: entry.id,
        water_consumption: n(row[81]),
        poly_electrolyte: n(row[82]),
        solution: n(row[83]),
        slurry_feed: n(row[84]),
        wet_cake_prod: n(row[85]),
        wet_cake_ts: n(row[86]),
        wet_cake_vs: n(row[87]),
        liquid_produced: n(row[88]),
        liquid_ts: n(row[89]),
        liquid_vs: n(row[90]),
        liquid_sent_to_lagoon: n(row[91])
      }, { transaction: t });

      // Raw Biogas: 92=D1, 93=D2, 94=D3, 95=Total, 96=Flared, 97=Gas Yield
      await MISRawBiogas.create({
        entry_id: entry.id,
        digester_01_gas: n(row[92]),
        digester_02_gas: n(row[93]),
        digester_03_gas: n(row[94]),
        total_raw_biogas: n(row[95]),
        rbg_flared: n(row[96]),
        gas_yield: n(row[97])
      }, { transaction: t });

      // Raw Biogas Quality: 98=CH4, 99=CO2, 100=H2S, 101=O2, 102=N2 (row 17 says RBG Quality at 98)
      await MISRawBiogasQuality.create({
        entry_id: entry.id,
        ch4: n(row[98]),
        co2: n(row[99]),
        h2s: n(row[100]),
        o2: n(row[101]),
        n2: n(row[102])
      }, { transaction: t });

      // Compressed Biogas: 103=Produced, 104-108=CH4,CO2,H2S,O2,N2, 109=Conv ratio, 110=CH4 Slippage, 111=Stock, 112=Sold
      await MISCompressedBiogas.create({
        entry_id: entry.id,
        produced: n(row[103]),
        ch4: n(row[104]),
        co2: n(row[105]),
        h2s: n(row[106]),
        o2: n(row[107]),
        n2: n(row[108]),
        conversion_ratio: n(row[109]),
        ch4_slippage: n(row[110]),
        cbg_stock: n(row[111]),
        cbg_sold: n(row[112])
      }, { transaction: t });

      // Compressors: 113=Comp1, 114=Comp2, 115=total
      await MISCompressors.create({
        entry_id: entry.id,
        compressor_1_hours: n(row[113]),
        compressor_2_hours: n(row[114]),
        total_hours: n(row[115])
      }, { transaction: t });

      // Fertilizer: 116=FOM Produced, 117=Inventory, 118=Sold, 119=Wt Avg, 120-124 Revenue/Lagoon/Loose
      await MISFertilizerData.create({
        entry_id: entry.id,
        fom_produced: n(row[116]),
        inventory: n(row[117]),
        sold: n(row[118]),
        weighted_average: n(row[119]),
        revenue_1: n(row[120]),
        lagoon_liquid_sold: n(row[121]),
        revenue_2: n(row[122]),
        loose_fom_sold: n(row[123]),
        revenue_3: n(row[124])
      }, { transaction: t });

      // Utilities: 126=Electricity, 127=Specific power
      await MISUtilities.create({
        entry_id: entry.id,
        electricity_consumption: n(row[126]),
        specific_power_consumption: n(row[127])
      }, { transaction: t });

      // Manpower: 128=Refex-SREL, 129=Third Party
      await MISManpowerData.create({
        entry_id: entry.id,
        refex_srel_staff: nInt(row[128]),
        third_party_staff: nInt(row[129])
      }, { transaction: t });

      // Plant Availability: 130=Working hrs, 131=Scheduled, 132=Unscheduled, 133=Total availability
      await MISPlantAvailability.create({
        entry_id: entry.id,
        working_hours: n(row[130]),
        scheduled_downtime: n(row[131]),
        unscheduled_downtime: n(row[132]),
        total_availability: n(row[133])
      }, { transaction: t });

      // HSE: 134-140
      await MISHSEData.create({
        entry_id: entry.id,
        safety_lti: nInt(row[134]),
        near_misses: nInt(row[135]),
        first_aid: nInt(row[136]),
        reportable_incidents: nInt(row[137]),
        mti: nInt(row[138]),
        other_incidents: nInt(row[139]),
        fatalities: nInt(row[140])
      }, { transaction: t });

      await t.commit();
      results.created++;
      console.log('Created entry for', dateStr);
    } catch (err) {
      await t.rollback();
      results.errors.push({ date: dateStr || dateSerial, error: err.message });
      console.error('Error for row', r, dateStr, err.message);
    }
  }

  console.log('\nImport complete:', results);
  process.exit(results.errors.length ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
