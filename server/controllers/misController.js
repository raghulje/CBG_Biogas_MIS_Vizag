const { Op } = require('sequelize');
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
    MISCBGSale,
    MISFuelUtilized,
    User,
    Role,
    MISEmailConfig,
    sequelize
} = require('../models');
const auditService = require('../services/auditService');
const emailService = require('../services/emailService');
const { getFeedMixingTankAttributes } = require('../utils/schemaCache');

const n = (val) => (val === '' || val === null || val === undefined ? 0 : parseFloat(val));

const transformEntry = (entry) => {
    const e = entry.toJSON ? entry.toJSON() : entry;
    const res = { ...e };

    if (e.rawMaterials) {
        res.rawMaterials = {
            cowDungPurchased: e.rawMaterials.cow_dung_purchased,
            cowDungStock: e.rawMaterials.cow_dung_stock,
            oldPressMudOpeningBalance: e.rawMaterials.old_press_mud_opening_balance,
            oldPressMudPurchased: e.rawMaterials.old_press_mud_purchased,
            oldPressMudDegradationLoss: e.rawMaterials.old_press_mud_degradation_loss,
            oldPressMudClosingStock: e.rawMaterials.old_press_mud_closing_stock,
            newPressMudPurchased: e.rawMaterials.new_press_mud_purchased,
            pressMudUsed: e.rawMaterials.press_mud_used,
            totalPressMudStock: e.rawMaterials.total_press_mud_stock,
            auditNote: e.rawMaterials.audit_note
        };
    }

    if (e.feedMixingTank) {
        res.feedMixingTank = {
            cowDungFeed: {
                qty: e.feedMixingTank.cow_dung_qty,
                ts: e.feedMixingTank.cow_dung_ts,
                vs: e.feedMixingTank.cow_dung_vs
            },
            pressmudFeed: {
                qty: e.feedMixingTank.pressmud_qty,
                ts: e.feedMixingTank.pressmud_ts,
                vs: e.feedMixingTank.pressmud_vs
            },
            permeateFeed: {
                qty: e.feedMixingTank.permeate_qty,
                ts: e.feedMixingTank.permeate_ts,
                vs: e.feedMixingTank.permeate_vs
            },
            waterQty: e.feedMixingTank.water_qty,
            waterTs: e.feedMixingTank.water_ts,
            waterVs: e.feedMixingTank.water_vs,
            pulpFeed: {
                qty: e.feedMixingTank.pulp_qty,
                ts: e.feedMixingTank.pulp_ts,
                vs: e.feedMixingTank.pulp_vs
            },
            maggieFeed: {
                qty: e.feedMixingTank.maggie_qty,
                ts: e.feedMixingTank.maggie_ts,
                vs: e.feedMixingTank.maggie_vs
            },
            otherFeedSubstrate: {
                qty: e.feedMixingTank.other_feed_substrate_qty,
                ts: e.feedMixingTank.other_feed_substrate_ts,
                vs: e.feedMixingTank.other_feed_substrate_vs
            },
            slurry: {
                total: e.feedMixingTank.slurry_total,
                ts: e.feedMixingTank.slurry_ts,
                vs: e.feedMixingTank.slurry_vs,
                ph: e.feedMixingTank.slurry_ph
            }
        };
    }

    if (e.digesters) {
        res.digesters = e.digesters.map(d => ({
            id: d.id,
            name: d.digester_name,
            feeding: { totalSlurryFeed: d.feeding_slurry, avgTs: d.feeding_ts_percent, avgVs: d.feeding_vs_percent },
            discharge: { totalSlurryOut: d.discharge_slurry, avgTs: d.discharge_ts_percent, avgVs: d.discharge_vs_percent },
            characteristics: {
                lignin: d.lignin, vfa: d.vfa, alkalinity: d.alkalinity, vfaAlkRatio: d.vfa_alk_ratio,
                ash: d.ash, density: d.density, ph: d.ph, temperature: d.temp, pressure: d.pressure, slurryLevel: d.slurry_level
            },
            health: {
                hrt: d.hrt, vsDestruction: d.vs_destruction, olr: d.olr, balloonLevel: d.balloon_level,
                agitatorCondition: d.agitator_condition, foamingLevel: d.foaming_level
            }
        }));
    }

    if (e.slsMachine) {
        res.slsMachine = {
            waterConsumption: e.slsMachine.water_consumption,
            polyElectrolyte: e.slsMachine.poly_electrolyte,
            solution: e.slsMachine.solution,
            slurryFeed: e.slsMachine.slurry_feed,
            wetCakeProduction: e.slsMachine.wet_cake_prod,
            wetCakeTs: e.slsMachine.wet_cake_ts,
            wetCakeVs: e.slsMachine.wet_cake_vs,
            liquidProduced: e.slsMachine.liquid_produced,
            liquidTs: e.slsMachine.liquid_ts,
            liquidVs: e.slsMachine.liquid_vs,
            liquidSentToLagoon: e.slsMachine.liquid_sent_to_lagoon
        };
    }

    if (e.rawBiogas) {
        res.rawBiogas = {
            digester01Gas: e.rawBiogas.digester_01_gas,
            digester02Gas: e.rawBiogas.digester_02_gas,
            digester03Gas: e.rawBiogas.digester_03_gas,
            totalRawBiogas: e.rawBiogas.total_raw_biogas,
            rbgFlared: e.rawBiogas.rbg_flared,
            gasYield: e.rawBiogas.gas_yield
        };
    }

    if (e.rawBiogasQuality) {
        res.rawBiogasQuality = e.rawBiogasQuality; // properties match (ch4, co2 etc) if key names are simple
        // Actually ch4 is ch4. correct.
    }

    if (e.compressedBiogas) {
        res.compressedBiogas = {
            produced: e.compressedBiogas.produced,
            ch4: e.compressedBiogas.ch4,
            co2: e.compressedBiogas.co2,
            h2s: e.compressedBiogas.h2s,
            o2: e.compressedBiogas.o2,
            n2: e.compressedBiogas.n2,
            conversionRatio: e.compressedBiogas.conversion_ratio,
            ch4Slippage: e.compressedBiogas.ch4_slippage,
            cbgStock: e.compressedBiogas.cbg_stock,
            cbgSold: e.compressedBiogas.cbg_sold
        };
    }

    if (e.cbgSales) {
        res.cbgSales = e.cbgSales.map(s => ({
            customerId: s.customer_id,
            quantity: s.quantity
        }));
    }

    if (e.fuelUtilized) {
        res.fuelUtilized = e.fuelUtilized.map(f => ({
            fuelType: f.fuel_type,
            customerId: f.customer_id,
            quantity: f.quantity
        }));
    }

    if (e.compressors) {
        res.compressors = {
            compressor1Hours: e.compressors.compressor_1_hours,
            compressor2Hours: e.compressors.compressor_2_hours,
            totalHours: e.compressors.total_hours
        };
    }

    if (e.fertilizer) {
        res.fertilizer = {
            fomProduced: e.fertilizer.fom_produced,
            inventory: e.fertilizer.inventory,
            sold: e.fertilizer.sold,
            weightedAverage: e.fertilizer.weighted_average,
            revenue1: e.fertilizer.revenue_1,
            lagoonLiquidSold: e.fertilizer.lagoon_liquid_sold,
            revenue2: e.fertilizer.revenue_2,
            looseFomSold: e.fertilizer.loose_fom_sold,
            revenue3: e.fertilizer.revenue_3
        };
    }

    if (e.utilities) {
        res.utilities = {
            electricityConsumption: e.utilities.electricity_consumption,
            specificPowerConsumption: e.utilities.specific_power_consumption
        };
    }

    if (e.manpower) {
        res.manpower = {
            refexSrelStaff: e.manpower.refex_srel_staff,
            thirdPartyStaff: e.manpower.third_party_staff
        };
    }

    if (e.plantAvailability) {
        const pa = Array.isArray(e.plantAvailability) ? e.plantAvailability[0] : e.plantAvailability;
        if (pa) {
            res.plantAvailability = {
                workingHours: pa.working_hours,
                scheduledDowntime: pa.scheduled_downtime,
                unscheduledDowntime: pa.unscheduled_downtime,
                totalAvailability: pa.total_availability
            };
        }
    }

    if (e.hse) {
        res.hse = {
            safetyLti: e.hse.safety_lti,
            nearMisses: e.hse.near_misses,
            firstAid: e.hse.first_aid,
            reportableIncidents: e.hse.reportable_incidents,
            mti: e.hse.mti,
            otherIncidents: e.hse.other_incidents,
            fatalities: e.hse.fatalities
        };
    }

    // Map remarks to review_comment if needed, but client expects 'remarks' in separate section
    // we saved remarks field in review_comment for now.
    res.remarks = e.review_comment;

    return res;
};

exports.createEntry = async (req, res) => {
    // ... [Logic same as previous step] - I should not rewrite the whole logic if I can help it, but replace_file_content is better.
    // However, I need to use transformEntry in getEntryById.
    // I will use write_to_file to overwrite the WHOLE file to include the helper and the updated getEntryById.
    // I'll copy the createEntry logic from previous step.
    const t = await sequelize.transaction();
    try {
        const { date, status, remarks, rawMaterials, feedMixingTank, digesters, slsMachine, rawBiogas, rawBiogasQuality, compressedBiogas, cbgSales, fuelUtilized, compressors, fertilizer, utilities, manpower, plantAvailability, hse } = req.body;
        const userId = req.user.id;
        const statusVal = status ? String(status).toLowerCase() : 'draft';
        const allowedStatus = ['draft', 'submitted', 'under_review', 'approved', 'rejected'].includes(statusVal) ? statusVal : 'draft';
        const entry = await MISDailyEntry.create({
            date: date || new Date().toISOString().slice(0, 10),
            status: allowedStatus,
            created_by: userId,
            review_comment: remarks || null
        }, { transaction: t });
        const entryId = entry.id;

        const childPromises = [];

        if (rawMaterials) childPromises.push(MISRawMaterials.create({ entry_id: entryId, cow_dung_purchased: n(rawMaterials.cowDungPurchased), cow_dung_stock: n(rawMaterials.cowDungStock), old_press_mud_opening_balance: n(rawMaterials.oldPressMudOpeningBalance), old_press_mud_purchased: n(rawMaterials.oldPressMudPurchased), old_press_mud_degradation_loss: n(rawMaterials.oldPressMudDegradationLoss), old_press_mud_closing_stock: n(rawMaterials.oldPressMudClosingStock), new_press_mud_purchased: n(rawMaterials.newPressMudPurchased), press_mud_used: n(rawMaterials.pressMudUsed), total_press_mud_stock: n(rawMaterials.totalPressMudStock), audit_note: rawMaterials.auditNote }, { transaction: t }));

        if (feedMixingTank) childPromises.push(MISFeedMixingTank.create({
            entry_id: entryId,
            cow_dung_qty: n(feedMixingTank.cowDungFeed?.qty),
            cow_dung_ts: n(feedMixingTank.cowDungFeed?.ts),
            cow_dung_vs: n(feedMixingTank.cowDungFeed?.vs),
            pressmud_qty: n(feedMixingTank.pressmudFeed?.qty),
            pressmud_ts: n(feedMixingTank.pressmudFeed?.ts),
            pressmud_vs: n(feedMixingTank.pressmudFeed?.vs),
            permeate_qty: n(feedMixingTank.permeateFeed?.qty),
            permeate_ts: n(feedMixingTank.permeateFeed?.ts),
            permeate_vs: n(feedMixingTank.permeateFeed?.vs),
            water_qty: n(feedMixingTank.waterQty),
            water_ts: n(feedMixingTank.waterTs),
            water_vs: n(feedMixingTank.waterVs),
            pulp_qty: n(feedMixingTank.pulpFeed?.qty),
            pulp_ts: n(feedMixingTank.pulpFeed?.ts),
            pulp_vs: n(feedMixingTank.pulpFeed?.vs),
            maggie_qty: n(feedMixingTank.maggieFeed?.qty),
            maggie_ts: n(feedMixingTank.maggieFeed?.ts),
            maggie_vs: n(feedMixingTank.maggieFeed?.vs),
            other_feed_substrate_qty: n(feedMixingTank.otherFeedSubstrate?.qty),
            other_feed_substrate_ts: n(feedMixingTank.otherFeedSubstrate?.ts),
            other_feed_substrate_vs: n(feedMixingTank.otherFeedSubstrate?.vs),
            slurry_total: n(feedMixingTank.slurry?.total),
            slurry_ts: n(feedMixingTank.slurry?.ts),
            slurry_vs: n(feedMixingTank.slurry?.vs),
            slurry_ph: n(feedMixingTank.slurry?.ph)
        }, { transaction: t }));

        if (digesters && Array.isArray(digesters)) {
            const digesterPromises = digesters.map(d => MISDigesterData.create({
                entry_id: entryId, digester_name: d.name,
                feeding_slurry: n(d.feeding?.totalSlurryFeed), feeding_ts_percent: n(d.feeding?.avgTs), feeding_vs_percent: n(d.feeding?.avgVs),
                discharge_slurry: n(d.discharge?.totalSlurryOut), discharge_ts_percent: n(d.discharge?.avgTs), discharge_vs_percent: n(d.discharge?.avgVs),
                lignin: n(d.characteristics?.lignin), vfa: n(d.characteristics?.vfa), alkalinity: n(d.characteristics?.alkalinity), vfa_alk_ratio: n(d.characteristics?.vfaAlkRatio), ash: n(d.characteristics?.ash), density: n(d.characteristics?.density), ph: n(d.characteristics?.ph), temp: n(d.characteristics?.temperature), pressure: n(d.characteristics?.pressure), slurry_level: n(d.characteristics?.slurryLevel),
                hrt: n(d.health?.hrt), vs_destruction: n(d.health?.vsDestruction), olr: n(d.health?.olr), balloon_level: n(d.health?.balloonLevel), agitator_condition: d.health?.agitatorCondition != null ? String(d.health.agitatorCondition).slice(0, 255) : null, foaming_level: n(d.health?.foamingLevel)
            }, { transaction: t }));
            childPromises.push(...digesterPromises);
        }

        if (slsMachine) childPromises.push(MISSLSData.create({ entry_id: entryId, water_consumption: n(slsMachine.waterConsumption), poly_electrolyte: n(slsMachine.polyElectrolyte), solution: n(slsMachine.solution), slurry_feed: n(slsMachine.slurryFeed), wet_cake_prod: n(slsMachine.wetCakeProduction), wet_cake_ts: n(slsMachine.wetCakeTs), wet_cake_vs: n(slsMachine.wetCakeVs), liquid_produced: n(slsMachine.liquidProduced), liquid_ts: n(slsMachine.liquidTs), liquid_vs: n(slsMachine.liquidVs), liquid_sent_to_lagoon: n(slsMachine.liquidSentToLagoon) }, { transaction: t }));

        if (rawBiogas) childPromises.push(MISRawBiogas.create({ entry_id: entryId, digester_01_gas: n(rawBiogas.digester01Gas), digester_02_gas: n(rawBiogas.digester02Gas), digester_03_gas: n(rawBiogas.digester03Gas), total_raw_biogas: n(rawBiogas.totalRawBiogas), rbg_flared: n(rawBiogas.rbgFlared), gas_yield: n(rawBiogas.gasYield) }, { transaction: t }));

        if (rawBiogasQuality) childPromises.push(MISRawBiogasQuality.create({ entry_id: entryId, ch4: n(rawBiogasQuality.ch4), co2: n(rawBiogasQuality.co2), h2s: n(rawBiogasQuality.h2s), o2: n(rawBiogasQuality.o2), n2: n(rawBiogasQuality.n2) }, { transaction: t }));

        if (compressedBiogas) childPromises.push(MISCompressedBiogas.create({ entry_id: entryId, produced: n(compressedBiogas.produced), ch4: n(compressedBiogas.ch4), co2: n(compressedBiogas.co2), h2s: n(compressedBiogas.h2s), o2: n(compressedBiogas.o2), n2: n(compressedBiogas.n2), conversion_ratio: n(compressedBiogas.conversionRatio), ch4_slippage: n(compressedBiogas.ch4Slippage), cbg_stock: n(compressedBiogas.cbgStock), cbg_sold: n(compressedBiogas.cbgSold) }, { transaction: t }));

        if (cbgSales && Array.isArray(cbgSales)) {
            const salePromises = cbgSales.map(s => MISCBGSale.create({
                entry_id: entryId,
                customer_id: s.customerId,
                quantity: n(s.quantity)
            }, { transaction: t }));
            childPromises.push(...salePromises);
        }

        if (fuelUtilized && Array.isArray(fuelUtilized)) {
            const fuelPromises = fuelUtilized
                .filter(f => f.customerId && f.fuelType && (f.quantity !== '' && f.quantity != null))
                .map(f => MISFuelUtilized.create({
                    entry_id: entryId,
                    fuel_type: String(f.fuelType),
                    customer_id: parseInt(f.customerId),
                    quantity: n(f.quantity)
                }, { transaction: t }));
            childPromises.push(...fuelPromises);
        }

        if (compressors) childPromises.push(MISCompressors.create({ entry_id: entryId, compressor_1_hours: n(compressors.compressor1Hours), compressor_2_hours: n(compressors.compressor2Hours), total_hours: n(compressors.totalHours) }, { transaction: t }));

        if (fertilizer) childPromises.push(MISFertilizerData.create({ entry_id: entryId, fom_produced: n(fertilizer.fomProduced), inventory: n(fertilizer.inventory), sold: n(fertilizer.sold), weighted_average: n(fertilizer.weightedAverage), revenue_1: n(fertilizer.revenue1), lagoon_liquid_sold: n(fertilizer.lagoonLiquidSold), revenue_2: n(fertilizer.revenue2), loose_fom_sold: n(fertilizer.looseFomSold), revenue_3: n(fertilizer.revenue3) }, { transaction: t }));

        if (utilities) childPromises.push(MISUtilities.create({ entry_id: entryId, electricity_consumption: n(utilities.electricityConsumption), specific_power_consumption: n(utilities.specificPowerConsumption) }, { transaction: t }));

        if (manpower) childPromises.push(MISManpowerData.create({ entry_id: entryId, refex_srel_staff: n(manpower.refexSrelStaff), third_party_staff: n(manpower.thirdPartyStaff) }, { transaction: t }));

        if (plantAvailability) childPromises.push(MISPlantAvailability.create({ entry_id: entryId, working_hours: n(plantAvailability.workingHours), scheduled_downtime: n(plantAvailability.scheduledDowntime), unscheduled_downtime: n(plantAvailability.unscheduledDowntime), total_availability: n(plantAvailability.totalAvailability) }, { transaction: t }));

        if (hse) childPromises.push(MISHSEData.create({ entry_id: entryId, safety_lti: n(hse.safetyLti), near_misses: n(hse.nearMisses), first_aid: n(hse.firstAid), reportable_incidents: n(hse.reportableIncidents), mti: n(hse.mti), other_incidents: n(hse.otherIncidents), fatalities: n(hse.fatalities) }, { transaction: t }));

        await Promise.all(childPromises);

        if (cbgSales && Array.isArray(cbgSales) && cbgSales.length > 0) {
            const totalSold = cbgSales.reduce((sum, s) => sum + n(s.quantity), 0);
            const cbgRow = await MISCompressedBiogas.findOne({ where: { entry_id: entryId }, transaction: t });
            if (cbgRow) {
                await cbgRow.update({ cbg_sold: totalSold }, { transaction: t });
            }
        }

        await t.commit();
        await auditService.log(userId, 'CREATE_MIS_ENTRY', 'MISDailyEntry', entry.id, null, entry, req);
        res.status(201).json({ message: 'Entry created successfully', id: entry.id });

    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            const isDateShift = (error.fields && error.fields.mis_daily_entries_date_shift) ||
                (error.errors && error.errors.some(e => e.path && e.path.includes('date_shift')));
            if (isDateShift) {
                return res.status(409).json({
                    message: 'An entry for this date already exists. Please edit the existing entry from the list or choose a different date.'
                });
            }
        }
        console.error('Create Entry Error:', error);
        res.status(500).json({ message: 'Error creating entry', error: error.message });
    }
};

/**
 * GET /mis-entries/for-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns full MIS entries (all nested data) for the date range for Final MIS report.
 */
exports.getEntriesForReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate query params are required (YYYY-MM-DD)' });
        }
        // Backward-compatible: select only feed mixing tank columns that exist (migration may not be applied yet)
        const feedMixingTankAttributes = await getFeedMixingTankAttributes();
        const entries = await MISDailyEntry.findAll({
            where: {
                date: { [Op.between]: [startDate, endDate] }
                // status: 'approved' — commented out: include all statuses in Final MIS Report
            },
            include: [
                { model: MISRawMaterials, as: 'rawMaterials' },
                { model: MISFeedMixingTank, as: 'feedMixingTank', attributes: feedMixingTankAttributes || undefined },
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
                { model: User, as: 'creator', attributes: ['name', 'email'] }
            ],
            order: [['date', 'ASC']]
        });
        const mapped = entries.map(e => {
            const transformed = transformEntry(e);
            const json = e.toJSON ? e.toJSON() : e;
            transformed.createdBy = json.creator?.name || 'Unknown';
            transformed.date = json.date; // ensure YYYY-MM-DD
            return transformed;
        });
        res.json(mapped);
    } catch (error) {
        console.error('getEntriesForReport error:', error);
        res.status(500).json({ message: 'Error fetching entries for report', error: error.message });
    }
};

exports.getEntries = async (req, res) => {
    try {
        // Allow admin users to include deleted entries via ?includeDeleted=true
        const includeDeleted = String(req.query.includeDeleted || '').toLowerCase() === 'true';
        let whereClause = { status: { [Op.ne]: 'deleted' } };
        if (includeDeleted) {
            // verify user is admin
            const userId = req.user && req.user.id;
            let currentUser = null;
            try {
                currentUser = await User.findByPk(userId, { include: [{ association: 'role' }] });
            } catch (err) { /* ignore */ }
            const roleName = currentUser && currentUser.role ? currentUser.role.name : null;
            if (roleName === 'Admin' || roleName === 'SuperAdmin') {
                whereClause = {}; // include everything
            } else {
                // Non-admins cannot include deleted
                whereClause = { status: { [Op.ne]: 'deleted' } };
            }
        }

        const entries = await MISDailyEntry.findAll({
            where: whereClause,
            attributes: ['id', 'date', 'status', 'created_by', 'created_at'],
            include: [
                { model: User, as: 'creator', attributes: ['name', 'email'] },
                { model: MISCompressedBiogas, as: 'compressedBiogas', attributes: ['produced', 'cbg_sold'] },
                { model: MISRawBiogas, as: 'rawBiogas', attributes: ['total_raw_biogas'] },
                { model: MISCBGSale, as: 'cbgSales', attributes: ['quantity'], separate: true },
            ],
            order: [['date', 'DESC']],
            limit: 500
        });

        const sumCbgSold = (json) => {
            const rows = Array.isArray(json.cbgSales) ? json.cbgSales : [];
            const fromSales = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
            if (fromSales > 0) return fromSales;
            return Number(json.compressedBiogas?.cbg_sold || 0);
        };

        const mapped = entries.map(e => {
            const json = e.toJSON();
            return {
                ...json,
                createdBy: json.creator ? json.creator.name : 'Unknown',
                compressedBiogas: {
                    produced: json.compressedBiogas?.produced || 0,
                    cbgSold: sumCbgSold(json),
                },
                rawBiogas: { totalRawBiogas: json.rawBiogas?.total_raw_biogas || 0 },
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching entries', error: error.message });
    }
};

exports.getEntryById = async (req, res) => {
    try {
        // Backward-compatible: mis_feed_mixing_tank new columns may not exist yet in DB
        const feedMixingTankAttributes = await getFeedMixingTankAttributes();
        const entry = await MISDailyEntry.findByPk(req.params.id, {
            include: [
                { model: MISRawMaterials, as: 'rawMaterials' },
                { model: MISFeedMixingTank, as: 'feedMixingTank', attributes: feedMixingTankAttributes || undefined },
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
                { model: MISCBGSale, as: 'cbgSales' },
                { model: MISFuelUtilized, as: 'fuelUtilized' },
                { model: User, as: 'creator', attributes: ['name', 'email'] }
            ]
        });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        const transformed = transformEntry(entry);
        res.json(transformed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.submitEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await MISDailyEntry.findByPk(id, { include: [{ model: User, as: 'creator' }] });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        await entry.update({ status: 'submitted' });

        // Recipients from Admin Panel (MIS Email Config). Use fallback only when config or field is not set (null/undefined).
        const toEmails = new Set();
        try {
            const configRow = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
            const parse = (s) => {
                if (s === null || s === undefined) return null;
                try {
                    const a = JSON.parse(s);
                    return Array.isArray(a) ? a : [s];
                } catch {
                    return String(s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
                }
            };
            const adminEmails = configRow ? parse(configRow.submit_notify_emails) : null;
            if (adminEmails !== null) {
                adminEmails.forEach(e => { const x = String(e).trim().toLowerCase(); if (x) toEmails.add(x); });
            }
            if (toEmails.size === 0 && (adminEmails === null || !configRow || configRow.submit_notify_emails == null)) {
                const roles = await Role.findAll({ where: { name: ['Manager', 'Admin'] } });
                const reviewers = await User.findAll({ where: { role_id: roles.map(r => r.id), is_active: true } });
                reviewers.forEach(r => { if (r.email) toEmails.add(r.email.trim().toLowerCase()); });
                (process.env.MIS_NOTIFY_EMAILS || '').split(',').forEach(e => { const x = e.trim().toLowerCase(); if (x) toEmails.add(x); });
            }
        } catch (_) {
            const roles = await Role.findAll({ where: { name: ['Manager', 'Admin'] } });
            const reviewers = await User.findAll({ where: { role_id: roles.map(r => r.id), is_active: true } });
            reviewers.forEach(r => { if (r.email) toEmails.add(r.email.trim().toLowerCase()); });
            (process.env.MIS_NOTIFY_EMAILS || '').split(',').forEach(e => { const x = e.trim().toLowerCase(); if (x) toEmails.add(x); });
        }

        const FE_URL = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3015';
        const subject = `MIS Entry Submitted - ${entry.date}`;
        const reviewLink = `${FE_URL.replace(/\/$/, '')}/mis-entry?view=${id}`;
        const html = `<p>Hello,</p>
                 <p>An MIS entry for <b>${entry.date}</b> has been submitted by ${entry.creator?.name || 'an operator'} and is awaiting your review.</p>
                 <p><a href="${reviewLink}">${reviewLink}</a></p>`;

        const recipients = Array.from(toEmails);
        const auditRecord = await auditService.log(
            req.user.id, 'SUBMIT_ENTRY', 'MISDailyEntry', id, null,
            { status: 'submitted', emails_sent_to: recipients },
            req
        );
        const meta = {
            audit_log_id: auditRecord?.id ?? null,
            entity_type: 'MISDailyEntry',
            entity_id: id
        };

        // Send emails in parallel to avoid blocking the response
        const emailPromises = recipients.map(async (email) => {
            try {
                await emailService.sendEmail(email, subject, html, meta);
            } catch (emailErr) {
                console.error('Submit notification email failed for', email, emailErr.message);
            }
        });

        await Promise.all(emailPromises);

        res.json({ message: 'Entry submitted successfully and notifications sent' });
    } catch (error) {
        console.error('Submit Entry Error:', error);
        res.status(500).json({ message: 'Error submitting entry', error: error.message });
    }
};

exports.approveEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await MISDailyEntry.findByPk(id, { include: [{ model: User, as: 'creator' }] });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        await entry.update({ status: 'approved' });
        await auditService.log(req.user.id, 'APPROVE_ENTRY', 'MISDailyEntry', id, null, { status: 'approved' }, req);

        // Notify Creator
        if (entry.creator && entry.creator.email) {
            await emailService.sendEmail(
                entry.creator.email,
                `MIS Entry Approved - ${entry.date}`,
                `<p>Hello ${entry.creator.name},</p>
                 <p>Your MIS entry for <b>${entry.date}</b> has been <b>Approved</b> by ${req.user.name}.</p>`
            );
        }

        res.json({ message: 'Entry approved successfully' });
    } catch (error) {
        console.error('Approve Entry Error:', error);
        res.status(500).json({ message: 'Error approving entry', error: error.message });
    }
};

exports.reviewEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await MISDailyEntry.findByPk(id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        await entry.update({ status: 'under_review' });
        await auditService.log(req.user.id, 'REVIEW_ENTRY', 'MISDailyEntry', id, { status: entry.status }, { status: 'under_review' }, req);
        res.json({ message: 'Entry marked for review' });
    } catch (error) {
        console.error('Review Entry Error:', error);
        res.status(500).json({ message: 'Error updating review status', error: error.message });
    }
};

exports.rejectEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { review_comment } = req.body;
        const entry = await MISDailyEntry.findByPk(id, { include: [{ model: User, as: 'creator' }] });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        await entry.update({ status: 'rejected', review_comment });
        await auditService.log(req.user.id, 'REJECT_ENTRY', 'MISDailyEntry', id, null, { status: 'rejected', review_comment }, req);

        // Notify Creator
        if (entry.creator && entry.creator.email) {
            await emailService.sendEmail(
                entry.creator.email,
                `MIS Entry Rejected - ${entry.date}`,
                `<p>Hello ${entry.creator.name},</p>
                 <p>Your MIS entry for <b>${entry.date}</b> has been <b>Rejected</b> by ${req.user.name}.</p>
                 <p><b>Reason/Comment:</b> ${review_comment || 'No comment provided'}</p>
                 <p>Please review and resubmit.</p>`
            );
        }

        res.json({ message: 'Entry rejected successfully' });
    } catch (error) {
        console.error('Reject Entry Error:', error);
        res.status(500).json({ message: 'Error rejecting entry', error: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    res.status(501).json({ message: 'Update not implemented yet for complex schema' });
};

exports.getDashboardData = async (req, res) => {
    res.json({ message: 'Dashboard data endpoint' });
};
