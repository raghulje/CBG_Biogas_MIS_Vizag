/**
 * MIS Entry Excel export/import column definitions and row mapping.
 * Keeps export, import template, and stored MIS data aligned.
 */

const num = (val) => (val === '' || val === null || val === undefined ? 0 : parseFloat(val));
const str = (val) => (val == null ? '' : String(val));

const DIGESTER_NAMES = ['Digester 01', 'Digester 02', 'Digester 03'];

const MIS_EXPORT_HEADERS = [
    'Date', 'Status', 'Shift', 'BreakdownRemark', 'CreatedBy',
    'CowDungPurchased', 'CowDungStock', 'OldPressMudOpeningBalance', 'OldPressMudPurchased', 'OldPressMudDegradationLoss', 'OldPressMudClosingStock', 'NewPressMudPurchased', 'PressMudUsed', 'TotalPressMudStock', 'AuditNote',
    'CowDungQty', 'CowDungTS', 'CowDungVS', 'PressmudQty', 'PressmudTS', 'PressmudVS', 'PermeateQty', 'PermeateTS', 'PermeateVS',
    'WaterQty', 'WaterTS', 'WaterVS',
    'PulpQty', 'PulpTS', 'PulpVS',
    'MaggieQty', 'MaggieTS', 'MaggieVS',
    'OtherFeedSubstrateQty', 'OtherFeedSubstrateTS', 'OtherFeedSubstrateVS',
    'Total',
    'SlurryTotal', 'SlurryTS', 'SlurryVS', 'SlurryPH',
    'Digester01_FeedingSlurry', 'Digester01_FeedingTS', 'Digester01_FeedingVS', 'Digester01_DischargeSlurry', 'Digester01_DischargeTS', 'Digester01_DischargeVS', 'Digester01_PH', 'Digester01_Temp', 'Digester01_HRT', 'Digester01_OLR',
    'Digester01_Lignin', 'Digester01_VFA', 'Digester01_Alkalinity', 'Digester01_VfaAlkRatio', 'Digester01_Ash', 'Digester01_Density', 'Digester01_Pressure', 'Digester01_SlurryLevel', 'Digester01_VsDestruction', 'Digester01_BalloonLevel', 'Digester01_AgitatorCondition', 'Digester01_FoamingLevel', 'Digester01_Remarks',
    'Digester02_FeedingSlurry', 'Digester02_FeedingTS', 'Digester02_FeedingVS', 'Digester02_DischargeSlurry', 'Digester02_DischargeTS', 'Digester02_DischargeVS', 'Digester02_PH', 'Digester02_Temp', 'Digester02_HRT', 'Digester02_OLR',
    'Digester02_Lignin', 'Digester02_VFA', 'Digester02_Alkalinity', 'Digester02_VfaAlkRatio', 'Digester02_Ash', 'Digester02_Density', 'Digester02_Pressure', 'Digester02_SlurryLevel', 'Digester02_VsDestruction', 'Digester02_BalloonLevel', 'Digester02_AgitatorCondition', 'Digester02_FoamingLevel', 'Digester02_Remarks',
    'Digester03_FeedingSlurry', 'Digester03_FeedingTS', 'Digester03_FeedingVS', 'Digester03_DischargeSlurry', 'Digester03_DischargeTS', 'Digester03_DischargeVS', 'Digester03_PH', 'Digester03_Temp', 'Digester03_HRT', 'Digester03_OLR',
    'Digester03_Lignin', 'Digester03_VFA', 'Digester03_Alkalinity', 'Digester03_VfaAlkRatio', 'Digester03_Ash', 'Digester03_Density', 'Digester03_Pressure', 'Digester03_SlurryLevel', 'Digester03_VsDestruction', 'Digester03_BalloonLevel', 'Digester03_AgitatorCondition', 'Digester03_FoamingLevel', 'Digester03_Remarks',
    'WaterConsumption', 'PolyElectrolyte', 'Solution', 'SlurryFeed', 'WetCakeProduction', 'WetCakeTS', 'WetCakeVS', 'LiquidProduced', 'LiquidTS', 'LiquidVS', 'LiquidSentToLagoon',
    'Digester01Gas', 'Digester02Gas', 'Digester03Gas', 'TotalRawBiogas', 'RbgFlared', 'GasYield',
    'RBG_CH4', 'RBG_CO2', 'RBG_H2S', 'RBG_O2', 'RBG_N2',
    'CBGProduced', 'CBG_CH4', 'CBG_CO2', 'CBG_H2S', 'CBG_O2', 'CBG_N2', 'ConversionRatio', 'Ch4Slippage', 'CbgStock', 'CbgSold', 'CBGSold', 'CBGSalesBreakdown',
    'Compressor1Hours', 'Compressor2Hours', 'TotalHours',
    'ElectricityConsumption', 'SpecificPowerConsumption',
    'FOMProduced', 'Inventory', 'Sold', 'WeightedAverage', 'Revenue1', 'LagoonLiquidSold', 'Revenue2', 'LooseFomSold', 'Revenue3',
    'RefexSrelStaff', 'ThirdPartyStaff',
    'WorkingHours', 'ScheduledDowntime', 'UnscheduledDowntime', 'TotalAvailability',
    'SafetyLTI', 'NearMisses', 'FirstAid', 'ReportableIncidents', 'MTI', 'OtherIncidents', 'Fatalities',
    'FuelUtilizedBreakdown'
];

function digesterAt(entry, index) {
    const list = Array.isArray(entry.digesters) ? entry.digesters : [];
    const name = DIGESTER_NAMES[index];
    return list.find((d) => d.digester_name === name) || list[index] || null;
}

function digesterExportCols(d, prefix) {
    const p = prefix;
    if (!d) {
        return {
            [`${p}_FeedingSlurry`]: 0, [`${p}_FeedingTS`]: 0, [`${p}_FeedingVS`]: 0,
            [`${p}_DischargeSlurry`]: 0, [`${p}_DischargeTS`]: 0, [`${p}_DischargeVS`]: 0,
            [`${p}_PH`]: 0, [`${p}_Temp`]: 0, [`${p}_HRT`]: 0, [`${p}_OLR`]: 0,
            [`${p}_Lignin`]: 0, [`${p}_VFA`]: 0, [`${p}_Alkalinity`]: 0, [`${p}_VfaAlkRatio`]: 0,
            [`${p}_Ash`]: 0, [`${p}_Density`]: 0, [`${p}_Pressure`]: 0, [`${p}_SlurryLevel`]: 0,
            [`${p}_VsDestruction`]: 0, [`${p}_BalloonLevel`]: 0, [`${p}_AgitatorCondition`]: '',
            [`${p}_FoamingLevel`]: 0, [`${p}_Remarks`]: ''
        };
    }
    return {
        [`${p}_FeedingSlurry`]: num(d.feeding_slurry),
        [`${p}_FeedingTS`]: num(d.feeding_ts_percent),
        [`${p}_FeedingVS`]: num(d.feeding_vs_percent),
        [`${p}_DischargeSlurry`]: num(d.discharge_slurry),
        [`${p}_DischargeTS`]: num(d.discharge_ts_percent),
        [`${p}_DischargeVS`]: num(d.discharge_vs_percent),
        [`${p}_PH`]: num(d.ph),
        [`${p}_Temp`]: num(d.temp),
        [`${p}_HRT`]: num(d.hrt),
        [`${p}_OLR`]: num(d.olr),
        [`${p}_Lignin`]: num(d.lignin),
        [`${p}_VFA`]: num(d.vfa),
        [`${p}_Alkalinity`]: num(d.alkalinity),
        [`${p}_VfaAlkRatio`]: num(d.vfa_alk_ratio),
        [`${p}_Ash`]: num(d.ash),
        [`${p}_Density`]: num(d.density),
        [`${p}_Pressure`]: num(d.pressure),
        [`${p}_SlurryLevel`]: num(d.slurry_level),
        [`${p}_VsDestruction`]: num(d.vs_destruction),
        [`${p}_BalloonLevel`]: num(d.balloon_level),
        [`${p}_AgitatorCondition`]: str(d.agitator_condition),
        [`${p}_FoamingLevel`]: num(d.foaming_level),
        [`${p}_Remarks`]: str(d.remarks)
    };
}

/** Sum of Pressmud, Cow Dung, Permeate, Water, Pulp, Maggie, Other Feed Substrate qty (MIS form "Total Qty") */
function computeTotalFeedQty(fmt) {
    if (!fmt) return 0;
    return (
        num(fmt.pressmud_qty) +
        num(fmt.cow_dung_qty) +
        num(fmt.permeate_qty) +
        num(fmt.water_qty) +
        num(fmt.pulp_qty) +
        num(fmt.maggie_qty) +
        num(fmt.other_feed_substrate_qty)
    );
}

function formatCbgSalesBreakdown(cbgSales) {
    const rows = Array.isArray(cbgSales) ? cbgSales : [];
    if (!rows.length) return '';
    return rows
        .map((s) => {
            const name = s.customer?.name || `Customer#${s.customer_id || '?'}`;
            return `${name}:${num(s.quantity)}`;
        })
        .join('; ');
}

function formatFuelBreakdown(fuelUtilized) {
    const rows = Array.isArray(fuelUtilized) ? fuelUtilized : [];
    if (!rows.length) return '';
    return rows
        .map((f) => {
            const name = f.customer?.name || `Customer#${f.customer_id || '?'}`;
            return `${f.fuel_type || 'Fuel'}|${name}:${num(f.quantity)}`;
        })
        .join('; ');
}

/** Total CBG sold: sum sale rows, else compressed_biogas.cbg_sold */
function totalCbgSoldForEntry(entry) {
    const rows = Array.isArray(entry.cbgSales) ? entry.cbgSales : [];
    const fromSales = rows.reduce((sum, r) => sum + num(r.quantity), 0);
    if (fromSales > 0) return fromSales;
    return num(entry.compressedBiogas?.cbg_sold);
}

function entryToExportRow(entry) {
    const rm = entry.rawMaterials || {};
    const fmt = entry.feedMixingTank || {};
    const rb = entry.rawBiogas || {};
    const rbq = entry.rawBiogasQuality || {};
    const cbg = entry.compressedBiogas || {};
    const comp = entry.compressors || {};
    const fert = entry.fertilizer || {};
    const util = entry.utilities || {};
    const mp = entry.manpower || {};
    const pa = entry.plantAvailability || {};
    const hse = entry.hse || {};
    const sls = entry.slsMachine || {};
    const cbgSold = totalCbgSoldForEntry(entry);

    const row = {
        Date: entry.date,
        Status: entry.status,
        Shift: entry.shift || 'General',
        BreakdownRemark: str(entry.review_comment),
        CreatedBy: entry.creator?.name || '',
        CowDungPurchased: num(rm.cow_dung_purchased),
        CowDungStock: num(rm.cow_dung_stock),
        OldPressMudOpeningBalance: num(rm.old_press_mud_opening_balance),
        OldPressMudPurchased: num(rm.old_press_mud_purchased),
        OldPressMudDegradationLoss: num(rm.old_press_mud_degradation_loss),
        OldPressMudClosingStock: num(rm.old_press_mud_closing_stock),
        NewPressMudPurchased: num(rm.new_press_mud_purchased),
        PressMudUsed: num(rm.press_mud_used),
        TotalPressMudStock: num(rm.total_press_mud_stock),
        AuditNote: str(rm.audit_note),
        CowDungQty: num(fmt.cow_dung_qty),
        CowDungTS: num(fmt.cow_dung_ts),
        CowDungVS: num(fmt.cow_dung_vs),
        PressmudQty: num(fmt.pressmud_qty),
        PressmudTS: num(fmt.pressmud_ts),
        PressmudVS: num(fmt.pressmud_vs),
        PermeateQty: num(fmt.permeate_qty),
        PermeateTS: num(fmt.permeate_ts),
        PermeateVS: num(fmt.permeate_vs),
        WaterQty: num(fmt.water_qty),
        WaterTS: num(fmt.water_ts),
        WaterVS: num(fmt.water_vs),
        PulpQty: num(fmt.pulp_qty),
        PulpTS: num(fmt.pulp_ts),
        PulpVS: num(fmt.pulp_vs),
        MaggieQty: num(fmt.maggie_qty),
        MaggieTS: num(fmt.maggie_ts),
        MaggieVS: num(fmt.maggie_vs),
        OtherFeedSubstrateQty: num(fmt.other_feed_substrate_qty),
        OtherFeedSubstrateTS: num(fmt.other_feed_substrate_ts),
        OtherFeedSubstrateVS: num(fmt.other_feed_substrate_vs),
        Total: computeTotalFeedQty(fmt),
        SlurryTotal: num(fmt.slurry_total),
        SlurryTS: num(fmt.slurry_ts),
        SlurryVS: num(fmt.slurry_vs),
        SlurryPH: num(fmt.slurry_ph),
        ...digesterExportCols(digesterAt(entry, 0), 'Digester01'),
        ...digesterExportCols(digesterAt(entry, 1), 'Digester02'),
        ...digesterExportCols(digesterAt(entry, 2), 'Digester03'),
        WaterConsumption: num(sls.water_consumption),
        PolyElectrolyte: num(sls.poly_electrolyte),
        Solution: num(sls.solution),
        SlurryFeed: num(sls.slurry_feed),
        WetCakeProduction: num(sls.wet_cake_prod),
        WetCakeTS: num(sls.wet_cake_ts),
        WetCakeVS: num(sls.wet_cake_vs),
        LiquidProduced: num(sls.liquid_produced),
        LiquidTS: num(sls.liquid_ts),
        LiquidVS: num(sls.liquid_vs),
        LiquidSentToLagoon: num(sls.liquid_sent_to_lagoon),
        Digester01Gas: num(rb.digester_01_gas),
        Digester02Gas: num(rb.digester_02_gas),
        Digester03Gas: num(rb.digester_03_gas),
        TotalRawBiogas: num(rb.total_raw_biogas),
        RbgFlared: num(rb.rbg_flared),
        GasYield: num(rb.gas_yield),
        RBG_CH4: num(rbq.ch4),
        RBG_CO2: num(rbq.co2),
        RBG_H2S: num(rbq.h2s),
        RBG_O2: num(rbq.o2),
        RBG_N2: num(rbq.n2),
        CBGProduced: num(cbg.produced),
        CBG_CH4: num(cbg.ch4),
        CBG_CO2: num(cbg.co2),
        CBG_H2S: num(cbg.h2s),
        CBG_O2: num(cbg.o2),
        CBG_N2: num(cbg.n2),
        ConversionRatio: num(cbg.conversion_ratio),
        Ch4Slippage: num(cbg.ch4_slippage),
        CbgStock: num(cbg.cbg_stock),
        CbgSold: num(cbg.cbg_sold),
        CBGSold: cbgSold,
        CBGSalesBreakdown: formatCbgSalesBreakdown(entry.cbgSales),
        Compressor1Hours: num(comp.compressor_1_hours),
        Compressor2Hours: num(comp.compressor_2_hours),
        TotalHours: num(comp.total_hours),
        ElectricityConsumption: num(util.electricity_consumption),
        SpecificPowerConsumption: num(util.specific_power_consumption),
        FOMProduced: num(fert.fom_produced),
        Inventory: num(fert.inventory),
        Sold: num(fert.sold),
        WeightedAverage: num(fert.weighted_average),
        Revenue1: num(fert.revenue_1),
        LagoonLiquidSold: num(fert.lagoon_liquid_sold),
        Revenue2: num(fert.revenue_2),
        LooseFomSold: num(fert.loose_fom_sold),
        Revenue3: num(fert.revenue_3),
        RefexSrelStaff: num(mp.refex_srel_staff),
        ThirdPartyStaff: num(mp.third_party_staff),
        WorkingHours: num(pa.working_hours),
        ScheduledDowntime: num(pa.scheduled_downtime),
        UnscheduledDowntime: num(pa.unscheduled_downtime),
        TotalAvailability: num(pa.total_availability),
        SafetyLTI: num(hse.safety_lti),
        NearMisses: num(hse.near_misses),
        FirstAid: num(hse.first_aid),
        ReportableIncidents: num(hse.reportable_incidents),
        MTI: num(hse.mti),
        OtherIncidents: num(hse.other_incidents),
        Fatalities: num(hse.fatalities),
        FuelUtilizedBreakdown: formatFuelBreakdown(entry.fuelUtilized)
    };

    return MIS_EXPORT_HEADERS.reduce((acc, key) => {
        acc[key] = row[key] !== undefined ? row[key] : '';
        return acc;
    }, {});
}

module.exports = {
    MIS_EXPORT_HEADERS,
    entryToExportRow,
    totalCbgSoldForEntry,
    computeTotalFeedQty
};
