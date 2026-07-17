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
    MISBiogasData,
    MISFeedData,
    MISPowerData,
    ImportLog,
    User,
    MISCBGSale,
    MISFuelUtilized,
    MISEmailConfig,
    Customer,
    sequelize
} = require('../models');
const auditService = require('../services/auditService');
const finalMISReportEmailService = require('../services/finalMISReportEmailService');
const XLSX = require('xlsx');
const { Op } = require('sequelize');

const n = (val) => (val === '' || val === null || val === undefined ? 0 : parseFloat(val));
const { MIS_EXPORT_HEADERS, entryToExportRow, totalCbgSoldForEntry } = require('../utils/misExportMapper');

function sumCbgSalesPayload(cbgSales) {
    if (!Array.isArray(cbgSales)) return 0;
    return cbgSales.reduce((sum, s) => sum + n(s.quantity), 0);
}

async function syncCompressedBiogasSold(entryId, totalSold, transaction) {
    const row = await MISCompressedBiogas.findOne({ where: { entry_id: entryId }, transaction });
    if (row) {
        await row.update({ cbg_sold: totalSold }, { transaction });
    } else if (totalSold > 0) {
        await MISCompressedBiogas.create({ entry_id: entryId, cbg_sold: totalSold }, { transaction });
    }
}

// UPDATE ENTRY - Full nested update support
exports.updateEntry = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { date, status, remarks, rawMaterials, feedMixingTank, digesters, slsMachine, rawBiogas, rawBiogasQuality, compressedBiogas, compressors, fertilizer, utilities, manpower, plantAvailability, hse, cbgSales, fuelUtilized } = req.body;
        const userId = req.user.id;

        // Find existing entry
        const entry = await MISDailyEntry.findByPk(id, {
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
                { model: MISCBGSale, as: 'cbgSales' },
                { model: MISFuelUtilized, as: 'fuelUtilized' }
            ]
        });

        if (!entry) {
            await t.rollback();
            return res.status(404).json({ message: 'Entry not found' });
        }

        // If entry is already approved, restrict edits to Admin/SuperAdmin or configured approved editors
        if (String(entry.status || '').toLowerCase() === 'approved') {
            // Load current user and their role
            const currentUser = await User.findByPk(userId, { include: [{ association: 'role' }] });
            const isAdmin = currentUser && currentUser.role && (currentUser.role.name === 'Admin' || currentUser.role.name === 'SuperAdmin');
            if (!isAdmin) {
                // Load approved editor emails from MISEmailConfig (if present)
                let approvedEditors = [];
                try {
                    const cfg = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
                    if (cfg && cfg.approved_editor_emails) {
                        try {
                            approvedEditors = JSON.parse(cfg.approved_editor_emails);
                        } catch {
                            approvedEditors = String(cfg.approved_editor_emails || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
                        }
                    }
                } catch (e) {
                    console.warn('Could not load approved editor emails:', e.message || e);
                }
                const userEmail = currentUser ? (currentUser.email || '').toLowerCase() : '';
                const allowed = approvedEditors.map(s => String(s).toLowerCase()).includes(userEmail);
                if (!allowed) {
                    await t.rollback();
                    return res.status(403).json({ message: 'Entry is approved — only Admin or configured approved editors can modify it' });
                }
            }
        }

        // Store old values for audit
        const oldValues = entry.toJSON();

        // Update main entry
        await entry.update({
            date: date || entry.date,
            status: status || entry.status,
            review_comment: remarks !== undefined ? remarks : entry.review_comment
        }, { transaction: t });

        // Update or create nested data
        if (rawMaterials) {
            if (entry.rawMaterials) {
                await entry.rawMaterials.update({
                    cow_dung_purchased: n(rawMaterials.cowDungPurchased),
                    cow_dung_stock: n(rawMaterials.cowDungStock),
                    old_press_mud_opening_balance: n(rawMaterials.oldPressMudOpeningBalance),
                    old_press_mud_purchased: n(rawMaterials.oldPressMudPurchased),
                    old_press_mud_degradation_loss: n(rawMaterials.oldPressMudDegradationLoss),
                    old_press_mud_closing_stock: n(rawMaterials.oldPressMudClosingStock),
                    new_press_mud_purchased: n(rawMaterials.newPressMudPurchased),
                    press_mud_used: n(rawMaterials.pressMudUsed),
                    total_press_mud_stock: n(rawMaterials.totalPressMudStock),
                    audit_note: rawMaterials.auditNote
                }, { transaction: t });
            } else {
                await MISRawMaterials.create({
                    entry_id: id,
                    cow_dung_purchased: n(rawMaterials.cowDungPurchased),
                    cow_dung_stock: n(rawMaterials.cowDungStock),
                    old_press_mud_opening_balance: n(rawMaterials.oldPressMudOpeningBalance),
                    old_press_mud_purchased: n(rawMaterials.oldPressMudPurchased),
                    old_press_mud_degradation_loss: n(rawMaterials.oldPressMudDegradationLoss),
                    old_press_mud_closing_stock: n(rawMaterials.oldPressMudClosingStock),
                    new_press_mud_purchased: n(rawMaterials.newPressMudPurchased),
                    press_mud_used: n(rawMaterials.pressMudUsed),
                    total_press_mud_stock: n(rawMaterials.totalPressMudStock),
                    audit_note: rawMaterials.auditNote
                }, { transaction: t });
            }
        }

        if (feedMixingTank) {
            if (entry.feedMixingTank) {
                await entry.feedMixingTank.update({
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
                }, { transaction: t });
            } else {
                await MISFeedMixingTank.create({
                    entry_id: id,
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
                }, { transaction: t });
            }
        }

        // Update digesters - delete existing and recreate
        if (digesters && Array.isArray(digesters)) {
            await MISDigesterData.destroy({ where: { entry_id: id }, transaction: t });
            const digesterPromises = digesters.map(d => MISDigesterData.create({
                entry_id: id,
                digester_name: d.name,
                feeding_slurry: n(d.feeding?.totalSlurryFeed),
                feeding_ts_percent: n(d.feeding?.avgTs),
                feeding_vs_percent: n(d.feeding?.avgVs),
                discharge_slurry: n(d.discharge?.totalSlurryOut),
                discharge_ts_percent: n(d.discharge?.avgTs),
                discharge_vs_percent: n(d.discharge?.avgVs),
                lignin: n(d.characteristics?.lignin),
                vfa: n(d.characteristics?.vfa),
                alkalinity: n(d.characteristics?.alkalinity),
                vfa_alk_ratio: n(d.characteristics?.vfaAlkRatio),
                ash: n(d.characteristics?.ash),
                density: n(d.characteristics?.density),
                ph: n(d.characteristics?.ph),
                temp: n(d.characteristics?.temperature),
                pressure: n(d.characteristics?.pressure),
                slurry_level: n(d.characteristics?.slurryLevel),
                hrt: n(d.health?.hrt),
                vs_destruction: n(d.health?.vsDestruction),
                olr: n(d.health?.olr),
                balloon_level: n(d.health?.balloonLevel),
                agitator_condition: d.health?.agitatorCondition,
                foaming_level: n(d.health?.foamingLevel)
            }, { transaction: t }));
            await Promise.all(digesterPromises);
        }

        // SLS Machine
        if (slsMachine) {
            const data = {
                water_consumption: n(slsMachine.waterConsumption),
                poly_electrolyte: n(slsMachine.polyElectrolyte),
                solution: n(slsMachine.solution),
                slurry_feed: n(slsMachine.slurryFeed),
                wet_cake_prod: n(slsMachine.wetCakeProduction),
                wet_cake_ts: n(slsMachine.wetCakeTs),
                wet_cake_vs: n(slsMachine.wetCakeVs),
                liquid_produced: n(slsMachine.liquidProduced),
                liquid_ts: n(slsMachine.liquidTs),
                liquid_vs: n(slsMachine.liquidVs),
                liquid_sent_to_lagoon: n(slsMachine.liquidSentToLagoon)
            };
            if (entry.slsMachine) {
                await entry.slsMachine.update(data, { transaction: t });
            } else {
                await MISSLSData.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Raw Biogas
        if (rawBiogas) {
            const data = {
                digester_01_gas: n(rawBiogas.digester01Gas),
                digester_02_gas: n(rawBiogas.digester02Gas),
                digester_03_gas: n(rawBiogas.digester03Gas),
                total_raw_biogas: n(rawBiogas.totalRawBiogas),
                rbg_flared: n(rawBiogas.rbgFlared),
                gas_yield: n(rawBiogas.gasYield)
            };
            if (entry.rawBiogas) {
                await entry.rawBiogas.update(data, { transaction: t });
            } else {
                await MISRawBiogas.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Raw Biogas Quality
        if (rawBiogasQuality) {
            const data = {
                ch4: n(rawBiogasQuality.ch4),
                co2: n(rawBiogasQuality.co2),
                h2s: n(rawBiogasQuality.h2s),
                o2: n(rawBiogasQuality.o2),
                n2: n(rawBiogasQuality.n2)
            };
            if (entry.rawBiogasQuality) {
                await entry.rawBiogasQuality.update(data, { transaction: t });
            } else {
                await MISRawBiogasQuality.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Compressed Biogas
        if (compressedBiogas) {
            const data = {
                produced: n(compressedBiogas.produced),
                ch4: n(compressedBiogas.ch4),
                co2: n(compressedBiogas.co2),
                h2s: n(compressedBiogas.h2s),
                o2: n(compressedBiogas.o2),
                n2: n(compressedBiogas.n2),
                conversion_ratio: n(compressedBiogas.conversionRatio),
                ch4_slippage: n(compressedBiogas.ch4Slippage),
                cbg_stock: n(compressedBiogas.cbgStock),
                cbg_sold: n(compressedBiogas.cbgSold)
            };
            if (entry.compressedBiogas) {
                await entry.compressedBiogas.update(data, { transaction: t });
            } else {
                await MISCompressedBiogas.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Compressors
        if (compressors) {
            const data = {
                compressor_1_hours: n(compressors.compressor1Hours),
                compressor_2_hours: n(compressors.compressor2Hours),
                total_hours: n(compressors.totalHours)
            };
            if (entry.compressors) {
                await entry.compressors.update(data, { transaction: t });
            } else {
                await MISCompressors.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Fertilizer
        if (fertilizer) {
            const data = {
                fom_produced: n(fertilizer.fomProduced),
                inventory: n(fertilizer.inventory),
                sold: n(fertilizer.sold),
                weighted_average: n(fertilizer.weightedAverage),
                revenue_1: n(fertilizer.revenue1),
                lagoon_liquid_sold: n(fertilizer.lagoonLiquidSold),
                revenue_2: n(fertilizer.revenue2),
                loose_fom_sold: n(fertilizer.looseFomSold),
                revenue_3: n(fertilizer.revenue3)
            };
            if (entry.fertilizer) {
                await entry.fertilizer.update(data, { transaction: t });
            } else {
                await MISFertilizerData.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Utilities
        if (utilities) {
            const data = {
                electricity_consumption: n(utilities.electricityConsumption),
                specific_power_consumption: n(utilities.specificPowerConsumption)
            };
            if (entry.utilities) {
                await entry.utilities.update(data, { transaction: t });
            } else {
                await MISUtilities.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Manpower
        if (manpower) {
            const data = {
                refex_srel_staff: n(manpower.refexSrelStaff),
                third_party_staff: n(manpower.thirdPartyStaff)
            };
            if (entry.manpower) {
                await entry.manpower.update(data, { transaction: t });
            } else {
                await MISManpowerData.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // Plant Availability
        if (plantAvailability) {
            const data = {
                working_hours: n(plantAvailability.workingHours),
                scheduled_downtime: n(plantAvailability.scheduledDowntime),
                unscheduled_downtime: n(plantAvailability.unscheduledDowntime),
                total_availability: n(plantAvailability.totalAvailability)
            };

            // Resilience: Handle case where it might be an array or a single object
            const paInstance = Array.isArray(entry.plantAvailability) ? entry.plantAvailability[0] : entry.plantAvailability;

            if (paInstance) {
                await paInstance.update(data, { transaction: t });
            } else {
                await MISPlantAvailability.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // HSE
        if (hse) {
            const data = {
                safety_lti: n(hse.safetyLti),
                near_misses: n(hse.nearMisses),
                first_aid: n(hse.firstAid),
                reportable_incidents: n(hse.reportableIncidents),
                mti: n(hse.mti),
                other_incidents: n(hse.otherIncidents),
                fatalities: n(hse.fatalities)
            };
            if (entry.hse) {
                await entry.hse.update(data, { transaction: t });
            } else {
                await MISHSEData.create({ entry_id: id, ...data }, { transaction: t });
            }
        }

        // CBG Sales - delete existing and recreate
        if (cbgSales && Array.isArray(cbgSales)) {
            await MISCBGSale.destroy({ where: { entry_id: id }, transaction: t });
            const validSales = cbgSales.filter(
                (s) => s.customerId && s.quantity != null && s.quantity !== ''
            );
            const salesPromises = validSales.map((s) =>
                MISCBGSale.create(
                    {
                        entry_id: id,
                        customer_id: parseInt(s.customerId, 10),
                        quantity: parseFloat(s.quantity) || 0,
                    },
                    { transaction: t }
                )
            );
            await Promise.all(salesPromises);
            await syncCompressedBiogasSold(id, sumCbgSalesPayload(validSales), t);
        }

        // Fuel Utilized - delete existing and recreate
        if (fuelUtilized && Array.isArray(fuelUtilized)) {
            await MISFuelUtilized.destroy({ where: { entry_id: id }, transaction: t });
            const fuelPromises = fuelUtilized
                .filter(f => f.customerId && f.fuelType && (f.quantity !== '' && f.quantity != null))
                .map(f => MISFuelUtilized.create({
                    entry_id: id,
                    fuel_type: String(f.fuelType),
                    customer_id: parseInt(f.customerId),
                    quantity: parseFloat(f.quantity) || 0
                }, { transaction: t }));
            await Promise.all(fuelPromises);
        }

        await t.commit();
        await auditService.log(userId, 'UPDATE_MIS_ENTRY', 'MISDailyEntry', id, oldValues, null, req);
        res.json({ message: 'Entry updated successfully' });

    } catch (error) {
        await t.rollback();
        console.error('Update Entry Error:', error);
        res.status(500).json({ message: 'Error updating entry', error: error.message });
    }
};

// DELETE ENTRY - Soft delete recommended
exports.deleteEntry = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const entry = await MISDailyEntry.findByPk(id);
        if (!entry) {
            await t.rollback();
            return res.status(404).json({ message: 'Entry not found' });
        }

        const status = String(entry.status || '').toLowerCase();
        const currentUser = await User.findByPk(userId, { include: [{ association: 'role' }] });
        const roleName = currentUser?.role?.name || null;
        const isAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';
        if (status !== 'draft' && !isAdmin) {
            await t.rollback();
            return res.status(400).json({ message: 'Only draft entries can be deleted. Submitted, approved, and rejected entries can only be deleted by Admin.' });
        }

        // Store for audit
        const oldValues = entry.toJSON();

        await entry.update({ status: 'deleted' }, { transaction: t });

        // Or hard delete if required:
        // await entry.destroy({ transaction: t });

        await t.commit();
        await auditService.log(userId, 'DELETE_MIS_ENTRY', 'MISDailyEntry', id, oldValues, null, req);
        res.json({ message: 'Entry deleted successfully' });

    } catch (error) {
        await t.rollback();
        console.error('Delete Entry Error:', error);
        res.status(500).json({ message: 'Error deleting entry', error: error.message });
    }
};

// HARD DELETE ENTRY - permanent removal (admin only)
exports.hardDeleteEntry = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Load user with role to ensure admin
        const currentUser = await User.findByPk(userId, { include: [{ association: 'role' }] });
        const roleName = currentUser && currentUser.role ? currentUser.role.name : null;
        if (!(roleName === 'Admin' || roleName === 'SuperAdmin')) {
            await t.rollback();
            return res.status(403).json({ message: 'Only Admin/SuperAdmin can perform permanent deletes' });
        }

        const entry = await MISDailyEntry.findByPk(id);
        if (!entry) {
            await t.rollback();
            return res.status(404).json({ message: 'Entry not found' });
        }

        const oldValues = entry.toJSON();

        // Remove child records first (parallel within the same transaction)
        await Promise.all([
            MISRawMaterials.destroy({ where: { entry_id: id }, transaction: t }),
            MISFeedMixingTank.destroy({ where: { entry_id: id }, transaction: t }),
            MISDigesterData.destroy({ where: { entry_id: id }, transaction: t }),
            MISSLSData.destroy({ where: { entry_id: id }, transaction: t }),
            MISRawBiogas.destroy({ where: { entry_id: id }, transaction: t }),
            MISRawBiogasQuality.destroy({ where: { entry_id: id }, transaction: t }),
            MISCompressedBiogas.destroy({ where: { entry_id: id }, transaction: t }),
            MISCompressors.destroy({ where: { entry_id: id }, transaction: t }),
            MISFertilizerData.destroy({ where: { entry_id: id }, transaction: t }),
            MISUtilities.destroy({ where: { entry_id: id }, transaction: t }),
            MISManpowerData.destroy({ where: { entry_id: id }, transaction: t }),
            MISPlantAvailability.destroy({ where: { entry_id: id }, transaction: t }),
            MISHSEData.destroy({ where: { entry_id: id }, transaction: t }),
            MISCBGSale.destroy({ where: { entry_id: id }, transaction: t }),
            MISFuelUtilized.destroy({ where: { entry_id: id }, transaction: t }),
        ]);
        await Promise.all([
            MISBiogasData?.destroy?.({ where: { entry_id: id }, transaction: t }).catch(() => {}),
            MISFeedData?.destroy?.({ where: { entry_id: id }, transaction: t }).catch(() => {}),
            MISPowerData?.destroy?.({ where: { entry_id: id }, transaction: t }).catch(() => {}),
        ]);

        // Finally remove main entry
        await entry.destroy({ transaction: t });

        await t.commit();
        await auditService.log(userId, 'HARD_DELETE_MIS_ENTRY', 'MISDailyEntry', id, oldValues, null, req);
        res.json({ message: 'Entry permanently deleted' });
    } catch (error) {
        await t.rollback();
        console.error('Hard Delete Entry Error:', error);
        res.status(500).json({ message: 'Error permanently deleting entry', error: error.message });
    }
};

// GET IMPORT TEMPLATE - Excel with all section headers
exports.getImportTemplate = async (req, res) => {
    try {
        const headers = MIS_EXPORT_HEADERS;
        const emptyRow = headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {});
        const worksheet = XLSX.utils.json_to_sheet([emptyRow], { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'MIS Import Template');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=MIS_Import_Template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Import template error:', error);
        res.status(500).json({ message: 'Error generating template', error: error.message });
    }
};

function parseExcelDate(val) {
    if (val == null || val === '') return new Date().toISOString().slice(0, 10);
    if (typeof val === 'number') {
        const utc = (val - 25569) * 86400 * 1000;
        return new Date(utc).toISOString().slice(0, 10);
    }
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

// IMPORT FROM EXCEL - parse correctly, insert all MIS tables, log activity
exports.importEntries = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const userId = req.user.id;
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        const results = { total: data.length, success: 0, failed: 0, errors: [] };

        // Preload creators once to avoid N+1 User.findOne per row
        const allUsers = await User.findAll({ attributes: ['id', 'name'] });
        const userByName = new Map(allUsers.map(u => [String(u.name || '').trim().toLowerCase(), u.id]));

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const t = await sequelize.transaction();
            try {
                const dateStr = parseExcelDate(row.Date || row.date);
                const statusVal = String(row.Status || row.status || 'draft').toLowerCase();
                const status = ['draft', 'submitted', 'approved', 'rejected'].includes(statusVal) ? statusVal : 'draft';

                // Resolve created_by: use Creator from import file if present and matches a user; else importer
                let createdById = userId;
                const createdByName = (row.CreatedBy || row.Created_By || row['Created By'] || '').toString().trim();
                if (createdByName) {
                    const mapped = userByName.get(createdByName.toLowerCase());
                    if (mapped) createdById = mapped;
                }

                const remarkRaw =
                    row.BreakdownRemark ??
                    row.BreakdownRemarks ??
                    row.Remarks ??
                    row.remarks ??
                    '';
                const reviewComment = String(remarkRaw).trim().slice(0, 2000) || null;

                const shiftRaw = String(row.Shift || row.shift || 'General').trim();
                const shift = ['Shift-1', 'Shift-2', 'General'].includes(shiftRaw) ? shiftRaw : 'General';

                const entry = await MISDailyEntry.create({
                    date: dateStr,
                    status,
                    shift,
                    created_by: createdById,
                    review_comment: reviewComment,
                }, { transaction: t });
                const entryId = entry.id;

                await MISRawMaterials.create({
                    entry_id: entryId,
                    cow_dung_purchased: n(row.CowDungPurchased),
                    cow_dung_stock: n(row.CowDungStock),
                    old_press_mud_opening_balance: n(row.OldPressMudOpeningBalance),
                    old_press_mud_purchased: n(row.OldPressMudPurchased),
                    old_press_mud_degradation_loss: n(row.OldPressMudDegradationLoss),
                    old_press_mud_closing_stock: n(row.OldPressMudClosingStock),
                    new_press_mud_purchased: n(row.NewPressMudPurchased),
                    press_mud_used: n(row.PressMudUsed),
                    total_press_mud_stock: n(row.TotalPressMudStock),
                    audit_note: row.AuditNote != null ? String(row.AuditNote).slice(0, 500) : null
                }, { transaction: t });

                await MISFeedMixingTank.create({
                    entry_id: entryId,
                    cow_dung_qty: n(row.CowDungQty),
                    cow_dung_ts: n(row.CowDungTS),
                    cow_dung_vs: n(row.CowDungVS),
                    pressmud_qty: n(row.PressmudQty),
                    pressmud_ts: n(row.PressmudTS),
                    pressmud_vs: n(row.PressmudVS),
                    permeate_qty: n(row.PermeateQty),
                    permeate_ts: n(row.PermeateTS),
                    permeate_vs: n(row.PermeateVS),
                    water_qty: n(row.WaterQty),
                    water_ts: n(row.WaterTS),
                    water_vs: n(row.WaterVS),
                    pulp_qty: n(row.PulpQty),
                    pulp_ts: n(row.PulpTS),
                    pulp_vs: n(row.PulpVS),
                    maggie_qty: n(row.MaggieQty),
                    maggie_ts: n(row.MaggieTS),
                    maggie_vs: n(row.MaggieVS),
                    other_feed_substrate_qty: n(row.OtherFeedSubstrateQty),
                    other_feed_substrate_ts: n(row.OtherFeedSubstrateTS),
                    other_feed_substrate_vs: n(row.OtherFeedSubstrateVS),
                    slurry_total: n(row.SlurryTotal),
                    slurry_ts: n(row.SlurryTS),
                    slurry_vs: n(row.SlurryVS),
                    slurry_ph: n(row.SlurryPH)
                }, { transaction: t });

                const digesterNames = ['Digester 01', 'Digester 02', 'Digester 03'];
                for (let d = 0; d < 3; d++) {
                    const p = 'Digester0' + (d + 1) + '_';
                    await MISDigesterData.create({
                        entry_id: entryId,
                        digester_name: digesterNames[d],
                        feeding_slurry: n(row[p + 'FeedingSlurry']),
                        feeding_ts_percent: n(row[p + 'FeedingTS']),
                        feeding_vs_percent: n(row[p + 'FeedingVS']),
                        discharge_slurry: n(row[p + 'DischargeSlurry']),
                        discharge_ts_percent: n(row[p + 'DischargeTS']),
                        discharge_vs_percent: n(row[p + 'DischargeVS']),
                        ph: n(row[p + 'PH']),
                        temp: n(row[p + 'Temp']),
                        hrt: n(row[p + 'HRT']),
                        olr: n(row[p + 'OLR']),
                        lignin: n(row[p + 'Lignin']),
                        vfa: n(row[p + 'VFA']),
                        alkalinity: n(row[p + 'Alkalinity']),
                        vfa_alk_ratio: n(row[p + 'VfaAlkRatio']),
                        ash: n(row[p + 'Ash']),
                        density: n(row[p + 'Density']),
                        pressure: n(row[p + 'Pressure']),
                        slurry_level: n(row[p + 'SlurryLevel']),
                        vs_destruction: n(row[p + 'VsDestruction']),
                        balloon_level: n(row[p + 'BalloonLevel']),
                        agitator_condition: row[p + 'AgitatorCondition'] != null ? String(row[p + 'AgitatorCondition']).slice(0, 100) : null,
                        foaming_level: n(row[p + 'FoamingLevel']),
                        remarks: row[p + 'Remarks'] != null ? String(row[p + 'Remarks']).slice(0, 500) : null
                    }, { transaction: t });
                }

                await MISRawBiogas.create({
                    entry_id: entryId,
                    digester_01_gas: n(row.Digester01Gas),
                    digester_02_gas: n(row.Digester02Gas),
                    digester_03_gas: n(row.Digester03Gas),
                    total_raw_biogas: n(row.TotalRawBiogas),
                    rbg_flared: n(row.RbgFlared),
                    gas_yield: n(row.GasYield)
                }, { transaction: t });

                await MISRawBiogasQuality.create({
                    entry_id: entryId,
                    ch4: n(row.RBG_CH4),
                    co2: n(row.RBG_CO2),
                    h2s: n(row.RBG_H2S),
                    o2: n(row.RBG_O2),
                    n2: n(row.RBG_N2)
                }, { transaction: t });

                await MISCompressedBiogas.create({
                    entry_id: entryId,
                    produced: n(row.CBGProduced),
                    ch4: n(row.CBG_CH4),
                    co2: n(row.CBG_CO2),
                    h2s: n(row.CBG_H2S),
                    o2: n(row.CBG_O2),
                    n2: n(row.CBG_N2),
                    conversion_ratio: n(row.ConversionRatio),
                    ch4_slippage: n(row.Ch4Slippage),
                    cbg_stock: n(row.CbgStock),
                    cbg_sold: n(row.CbgSold)
                }, { transaction: t });

                await MISCompressors.create({
                    entry_id: entryId,
                    compressor_1_hours: n(row.Compressor1Hours),
                    compressor_2_hours: n(row.Compressor2Hours),
                    total_hours: n(row.TotalHours)
                }, { transaction: t });

                await MISFertilizerData.create({
                    entry_id: entryId,
                    fom_produced: n(row.FOMProduced),
                    inventory: n(row.Inventory),
                    sold: n(row.Sold),
                    weighted_average: n(row.WeightedAverage),
                    revenue_1: n(row.Revenue1),
                    lagoon_liquid_sold: n(row.LagoonLiquidSold),
                    revenue_2: n(row.Revenue2),
                    loose_fom_sold: n(row.LooseFomSold),
                    revenue_3: n(row.Revenue3)
                }, { transaction: t });

                await MISUtilities.create({
                    entry_id: entryId,
                    electricity_consumption: n(row.ElectricityConsumption),
                    specific_power_consumption: n(row.SpecificPowerConsumption)
                }, { transaction: t });

                await MISPlantAvailability.create({
                    entry_id: entryId,
                    working_hours: n(row.WorkingHours),
                    scheduled_downtime: n(row.ScheduledDowntime),
                    unscheduled_downtime: n(row.UnscheduledDowntime),
                    total_availability: n(row.TotalAvailability)
                }, { transaction: t });

                await MISHSEData.create({
                    entry_id: entryId,
                    safety_lti: n(row.SafetyLTI),
                    near_misses: n(row.NearMisses),
                    first_aid: n(row.FirstAid),
                    reportable_incidents: n(row.ReportableIncidents),
                    mti: n(row.MTI),
                    other_incidents: n(row.OtherIncidents),
                    fatalities: n(row.Fatalities)
                }, { transaction: t });

                await MISManpowerData.create({
                    entry_id: entryId,
                    refex_srel_staff: n(row.RefexSrelStaff),
                    third_party_staff: n(row.ThirdPartyStaff)
                }, { transaction: t });

                await MISSLSData.create({
                    entry_id: entryId,
                    water_consumption: n(row.WaterConsumption),
                    poly_electrolyte: n(row.PolyElectrolyte),
                    solution: n(row.Solution),
                    slurry_feed: n(row.SlurryFeed),
                    wet_cake_prod: n(row.WetCakeProduction),
                    wet_cake_ts: n(row.WetCakeTS),
                    wet_cake_vs: n(row.WetCakeVS),
                    liquid_produced: n(row.LiquidProduced),
                    liquid_ts: n(row.LiquidTS),
                    liquid_vs: n(row.LiquidVS),
                    liquid_sent_to_lagoon: n(row.LiquidSentToLagoon)
                }, { transaction: t });

                await t.commit();
                results.success++;
            } catch (error) {
                await t.rollback();
                results.failed++;
                results.errors.push({ rowIndex: i + 2, error: error.message });
            }
        }

        await ImportLog.create({
            imported_by: userId,
            filename: req.file.originalname || 'upload.xlsx',
            records_processed: results.success,
            records_failed: results.failed,
            status: results.failed === 0 ? 'success' : (results.success > 0 ? 'partial' : 'failed'),
            error_log: results.errors.length ? results.errors : null
        });

        res.json({ message: 'Import completed', results });
    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ message: 'Error importing data', error: error.message });
    }
};

// EXPORT TO EXCEL
exports.exportEntries = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        const where = {};
        // where.status = 'approved'; — commented out: export all statuses
        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        }
        if (status) {
            where.status = status;
        }

        const entries = await MISDailyEntry.findAll({
            where,
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
                { model: User, as: 'creator', attributes: ['name'] },
                {
                    model: MISCBGSale,
                    as: 'cbgSales',
                    attributes: ['customer_id', 'quantity'],
                    include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
                    separate: true
                },
                {
                    model: MISFuelUtilized,
                    as: 'fuelUtilized',
                    include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
                    separate: true
                },
            ],
            order: [['date', 'DESC']]
        });

        const excelData = entries.map(entryToExportRow);
        const worksheet = XLSX.utils.json_to_sheet(excelData, { header: MIS_EXPORT_HEADERS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'MIS Entries');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=mis_entries_export.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ message: 'Error exporting data', error: error.message });
    }
};

const calendarUtils = require('../utils/calendarUtils');
const { getFeedMixingTankAttributes } = require('../utils/schemaCache');

// DASHBOARD DATA - uses MIS entry data; supports period (day/week/month/year) or custom startDate/endDate
// Week = calendar week (Week 1 = Jan 1–7, Week 2 = Jan 8–14, etc.). Uses date-fns via calendarUtils.
exports.getDashboardData = async (req, res) => {
    try {
        const { period = 'month', startDate: qStart, endDate: qEnd, year: qYear, week: qWeek, month: qMonth } = req.query;
        const now = new Date();
        let startStr;
        let endStr;

        if (qStart && qEnd) {
            startStr = String(qStart).slice(0, 10);
            endStr = String(qEnd).slice(0, 10);
        } else {
            switch (period) {
                case 'day':
                    startStr = calendarUtils.toDateString(now);
                    endStr = startStr;
                    break;
                case 'week': {
                    const y = qYear != null ? parseInt(qYear, 10) : now.getFullYear();
                    const w = qWeek != null ? parseInt(qWeek, 10) : calendarUtils.getCalendarWeek(now);
                    const { start, end } = calendarUtils.getCalendarWeekRange(y, w);
                    startStr = calendarUtils.toDateString(start);
                    endStr = calendarUtils.toDateString(end);
                    break;
                }
                case 'year': {
                    const y = qYear != null ? parseInt(qYear, 10) : now.getFullYear();
                    const { start, end } = calendarUtils.getYearRange(y);
                    startStr = calendarUtils.toDateString(start);
                    endStr = calendarUtils.toDateString(end);
                    break;
                }
                case 'month':
                default: {
                    const y = qYear != null ? parseInt(qYear, 10) : now.getFullYear();
                    const m = qMonth != null ? parseInt(qMonth, 10) : (now.getMonth() + 1);
                    const { start, end } = calendarUtils.getMonthRange(y, m);
                    startStr = calendarUtils.toDateString(start);
                    endStr = calendarUtils.toDateString(end);
                    break;
                }
            }
        }

        const feedMixingTankAttributes = await getFeedMixingTankAttributes();
        // Lean attributes only — same aggregation math, less data transferred from MySQL
        const entries = await MISDailyEntry.findAll({
            where: {
                date: { [Op.between]: [startStr, endStr] }
                // status: 'approved' — commented out: dashboard shows all statuses
            },
            attributes: ['id', 'date'],
            include: [
                { model: MISRawBiogas, as: 'rawBiogas', attributes: ['total_raw_biogas'] },
                { model: MISCompressedBiogas, as: 'compressedBiogas', attributes: ['produced', 'cbg_sold'] },
                { model: MISFertilizerData, as: 'fertilizer', attributes: ['fom_produced', 'sold', 'lagoon_liquid_sold'] },
                { model: MISUtilities, as: 'utilities', attributes: ['electricity_consumption'] },
                { model: MISPlantAvailability, as: 'plantAvailability', attributes: ['total_availability'] },
                { model: MISHSEData, as: 'hse', attributes: ['safety_lti', 'near_misses'] },
                { model: MISFeedMixingTank, as: 'feedMixingTank', attributes: feedMixingTankAttributes },
                { model: MISCBGSale, as: 'cbgSales', attributes: ['quantity'], separate: true },
                { model: MISFuelUtilized, as: 'fuelUtilized', attributes: ['quantity', 'fuel_type'], separate: true }
            ]
        });

        // Calculate metrics
        const totalRawBiogas = entries.reduce((sum, e) => sum + n(e.rawBiogas?.total_raw_biogas), 0);
        const totalCBGProduced = entries.reduce((sum, e) => sum + n(e.compressedBiogas?.produced), 0);
        // Per entry: sum all customer sale rows, else stored cbg_sold (same as Excel export).
        const totalCBGSold = entries.reduce((sum, e) => sum + totalCbgSoldForEntry(e), 0);

        const totalFOMProduced = entries.reduce((sum, e) => sum + n(e.fertilizer?.fom_produced), 0);
        const totalFOMSold = entries.reduce((sum, e) => sum + n(e.fertilizer?.sold), 0);
        const totalLFOMSold = entries.reduce((sum, e) => sum + n(e.fertilizer?.lagoon_liquid_sold), 0);
        const avgPlantAvailability = entries.length > 0
            ? entries.reduce((sum, e) => sum + n(e.plantAvailability?.total_availability), 0) / entries.length
            : 0;
        const totalElectricityConsumption = entries.reduce((sum, e) => sum + n(e.utilities?.electricity_consumption), 0);
        const totalHSEIncidents = entries.reduce((sum, e) => sum + n(e.hse?.safety_lti) + n(e.hse?.near_misses), 0);
        const totalFeed = entries.reduce((sum, e) => {
            const fmt = e.feedMixingTank;
            if (!fmt) return sum;
            return sum + (
                n(fmt.cow_dung_qty) +
                n(fmt.pressmud_qty) +
                n(fmt.permeate_qty) +
                n(fmt.water_qty) +
                n(fmt.pulp_qty) +
                n(fmt.maggie_qty) +
                n(fmt.other_feed_substrate_qty)
            );
        }, 0);

        // Averages based on number of entries (not calendar days) — for week, month, year, quarter, custom
        const entryCount = Math.max(1, entries.length);

        const avgFeed = totalFeed / entryCount;
        const avgRawBiogas = totalRawBiogas / entryCount;
        const avgCBGProduced = totalCBGProduced / entryCount;
        const avgCBGSold = totalCBGSold / entryCount;
        const avgFOMProduced = totalFOMProduced / entryCount;
        const avgFOMSold = totalFOMSold / entryCount;
        const avgLFOMSold = totalLFOMSold / entryCount;

        // Per-entry metrics (input/output and sold per entry)
        const feedPerEntry = totalFeed / entryCount;
        const cbgProducedPerEntry = totalCBGProduced / entryCount;
        const fomProducedPerEntry = totalFOMProduced / entryCount;
        const lfomSoldPerEntry = totalLFOMSold / entryCount;
        const cbgSoldPerEntry = totalCBGSold / entryCount;
        const fomSoldPerEntry = totalFOMSold / entryCount;

        // Petrol and Diesel: total and average per entry (from fuel utilized)
        let totalPetrol = 0;
        let totalDiesel = 0;
        entries.forEach(e => {
            (e.fuelUtilized || []).forEach(f => {
                const qty = n(f.quantity);
                if (String(f.fuel_type || '').toLowerCase() === 'petrol') totalPetrol += qty;
                else if (String(f.fuel_type || '').toLowerCase() === 'diesel') totalDiesel += qty;
            });
        });
        const petrolAvgPerEntry = totalPetrol / entryCount;
        const dieselAvgPerEntry = totalDiesel / entryCount;

        // Daily trend data
        const dailyData = entries.map(e => {
            const rb = e.rawBiogas || {};
            const cbg = e.compressedBiogas || {};
            return {
                date: e.date,
                // Independent fields — do not alias metrics onto each other
                rawBiogas: n(rb.total_raw_biogas ?? rb.totalRawBiogas),
                cbgProduced: n(cbg.produced),
                cbgSold: totalCbgSoldForEntry(e),
                plantAvailability: n(e.plantAvailability?.total_availability)
            };
        });

        res.json({
            period,
            summary: {
                totalEntries: entries.length,
                totalRawBiogas,
                totalCBGProduced,
                totalCBGSold,
                totalFOMProduced,
                totalFOMSold,
                totalLFOMSold,
                avgPlantAvailability: avgPlantAvailability.toFixed(2),
                totalElectricityConsumption,
                totalHSEIncidents,
                totalFeed,
                entryCount,
                avgFeed,
                avgRawBiogas,
                avgCBGProduced,
                avgCBGSold,
                avgFOMProduced,
                avgFOMSold,
                avgLFOMSold,
                feedPerEntry,
                cbgProducedPerEntry,
                fomProducedPerEntry,
                lfomSoldPerEntry,
                cbgSoldPerEntry,
                fomSoldPerEntry,
                totalPetrol,
                totalDiesel,
                petrolAvgPerEntry,
                dieselAvgPerEntry
            },
            trends: dailyData
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
};

// Parse filter params into startDate, endDate (YYYY-MM-DD)
function getDateRangeFromFilter(query) {
    const { startDate, endDate, financialYear, quarter, year } = query;
    let start, end;

    if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
    } else if (financialYear && /^\d{4}-\d{2}$/.test(financialYear)) {
        // e.g. "2024-25" => Apr 1, 2024 to Mar 31, 2025
        const [y1] = financialYear.split('-').map(Number);
        start = new Date(y1, 3, 1);      // April 1
        end = new Date(y1 + 1, 2, 31);  // March 31 next year
    } else if (quarter && year) {
        const y = parseInt(year, 10);
        const q = parseInt(quarter.replace('Q', ''), 10) || 1;
        const monthStart = (q - 1) * 3;  // Q1=0, Q2=3, Q3=6, Q4=9
        start = new Date(y, monthStart, 1);
        end = new Date(y, monthStart + 3, 0);  // last day of quarter
    } else {
        // default: current financial year (Apr to Mar)
        const now = new Date();
        const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        start = new Date(y, 3, 1);
        end = new Date(y + 1, 2, 31);
    }

    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10)
    };
}

// CONSOLIDATED MIS DATA - aggregates for date range (for Consolidated MIS v2 view)
exports.getConsolidatedData = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRangeFromFilter(req.query);

        const entries = await MISDailyEntry.findAll({
            where: {
                date: { [Op.between]: [startDate, endDate] }
                // status: 'approved' — commented out: consolidated report includes all statuses
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
                { model: MISHSEData, as: 'hse' }
            ],
            order: [['date', 'ASC']]
        });

        const n = (v) => (v === undefined || v === null || v === '' ? 0 : parseFloat(v));
        const sum = (arr, fn) => arr.reduce((s, e) => s + (fn(e) || 0), 0);
        const avg = (arr, fn) => (arr.length ? sum(arr, fn) / arr.length : 0);

        // Group digesters by name (D-01, D-02, D-03) across entries
        const digesterByKey = {};
        entries.forEach(entry => {
            (entry.digesters || []).forEach(d => {
                const key = (d.digester_name || '').replace(/\s+/g, ' ').trim() || 'Unknown';
                if (!digesterByKey[key]) digesterByKey[key] = [];
                digesterByKey[key].push(d);
            });
        });
        const digesterNames = ['Digester 01', 'Digester 02', 'Digester 03'].filter(name =>
            digesterByKey[name]?.length || digesterByKey['D-01']?.length || digesterByKey['D-02']?.length || digesterByKey['D-03']?.length
        );
        const dNames = digesterNames.length ? digesterNames : (Object.keys(digesterByKey).length ? Object.keys(digesterByKey) : ['D-01', 'D-02', 'D-03']);

        const digestersConsolidated = dNames.map(name => {
            const list = digesterByKey[name] || digesterByKey[name.replace('Digester ', 'D-')] || [];
            return {
                name: name.startsWith('Digester') ? name.replace('Digester ', 'D-') : name,
                ts: list.length ? avg(list, d => n(d.feeding_ts_percent) || n(d.discharge_ts_percent)) : 0,
                vs: list.length ? avg(list, d => n(d.feeding_vs_percent) || n(d.discharge_vs_percent)) : 0,
                ph: list.length ? avg(list, d => n(d.ph)) : 0,
                vfaTic: list.length ? avg(list, d => n(d.vfa_alk_ratio)) : 0,
                slurryLevel: list.length ? avg(list, d => n(d.slurry_level)) : 0,
                hrt: list.length ? avg(list, d => n(d.hrt)) : 0,
                olr: list.length ? avg(list, d => n(d.olr)) : 0,
                temp: list.length ? avg(list, d => n(d.temp)) : 0,
                feedingSlurry: sum(list, d => n(d.feeding_slurry)),
                dischargeSlurry: sum(list, d => n(d.discharge_slurry))
            };
        });

        const avgDigester = digestersConsolidated.length ? {
            name: 'Average',
            ts: avg(digestersConsolidated, d => d.ts),
            vs: avg(digestersConsolidated, d => d.vs),
            ph: avg(digestersConsolidated, d => d.ph),
            vfaTic: avg(digestersConsolidated, d => d.vfaTic),
            slurryLevel: avg(digestersConsolidated, d => d.slurryLevel),
            hrt: avg(digestersConsolidated, d => d.hrt),
            olr: avg(digestersConsolidated, d => d.olr),
            temp: avg(digestersConsolidated, d => d.temp)
        } : null;

        // D-01 and D-02 are the only digesters; D-03 column = Total = D-01 + D-02
        const pressMudD01 = sum(entries, e => (e.digesters && e.digesters[0]) ? n(e.digesters[0].feeding_slurry) : 0);
        const pressMudD02 = sum(entries, e => (e.digesters && e.digesters[1]) ? n(e.digesters[1].feeding_slurry) : 0);
        const d01Discharge = sum(entries, e => (e.digesters && e.digesters[0]) ? n(e.digesters[0].discharge_slurry) : 0);
        const d02Discharge = sum(entries, e => (e.digesters && e.digesters[1]) ? n(e.digesters[1].discharge_slurry) : 0);
        const feeding = {
            pressMudD01,
            pressMudD02,
            pressMudD03: pressMudD01 + pressMudD02,
            pressMudTotal: pressMudD01 + pressMudD02,
            cowDungD01: 0,
            cowDungD02: 0,
            cowDungD03: 0,
            cowDungTotal: sum(entries, e => (e.feedMixingTank && n(e.feedMixingTank.cow_dung_qty)) || 0),
            otherFeedstockTotal: 0,
            decanterPermeate: sum(entries, e => (e.feedMixingTank && n(e.feedMixingTank.permeate_qty)) || 0),
            water: sum(entries, e => (e.feedMixingTank && n(e.feedMixingTank.water_qty)) || 0),
            digester03Slurry: d01Discharge + d02Discharge,
            totalFeedInput: sum(entries, e => (e.feedMixingTank && n(e.feedMixingTank.slurry_total)) || 0)
        };

        const rawMaterialQuality = {
            tsPercent: avg(entries, e => e.feedMixingTank && n(e.feedMixingTank.slurry_ts)),
            vsPercent: avg(entries, e => e.feedMixingTank && n(e.feedMixingTank.slurry_vs)),
            ph: avg(entries, e => e.feedMixingTank && n(e.feedMixingTank.slurry_ph))
        };

        const biogasQuality = {
            ch4: avg(entries, e => e.rawBiogasQuality && n(e.rawBiogasQuality.ch4)),
            co2: avg(entries, e => e.rawBiogasQuality && n(e.rawBiogasQuality.co2)),
            o2: avg(entries, e => e.rawBiogasQuality && n(e.rawBiogasQuality.o2)),
            h2s: avg(entries, e => e.rawBiogasQuality && n(e.rawBiogasQuality.h2s)),
            n2: avg(entries, e => e.rawBiogasQuality && n(e.rawBiogasQuality.n2))
        };

        const biogasProduction = {
            rbgProduced: sum(entries, e => e.rawBiogas && n(e.rawBiogas.total_raw_biogas)),
            rbgFlared: sum(entries, e => e.rawBiogas && n(e.rawBiogas.rbg_flared)),
            usedInKitchen: 0,
            sentToPurification: sum(entries, e => e.rawBiogas && n(e.rawBiogas.total_raw_biogas)) - sum(entries, e => e.rawBiogas && n(e.rawBiogas.rbg_flared))
        };

        const cbgQuality = {
            ch4: avg(entries, e => e.compressedBiogas && n(e.compressedBiogas.ch4)),
            co2: avg(entries, e => e.compressedBiogas && n(e.compressedBiogas.co2)),
            o2: avg(entries, e => e.compressedBiogas && n(e.compressedBiogas.o2)),
            h2s: avg(entries, e => e.compressedBiogas && n(e.compressedBiogas.h2s)),
            n2: avg(entries, e => e.compressedBiogas && n(e.compressedBiogas.n2))
        };

        const cbgKg = {
            production: sum(entries, e => e.compressedBiogas && n(e.compressedBiogas.produced)),
            dispatch: sum(entries, e => e.compressedBiogas && n(e.compressedBiogas.cbg_sold)),
            gasYield: entries.length ? (sum(entries, e => e.rawBiogas && n(e.rawBiogas.gas_yield)) / entries.length) : 0,
            cf: avg(entries, e => e.compressedBiogas && n(e.compressedBiogas.conversion_ratio))
        };

        const sls = {
            runHrs: sum(entries, e => e.compressors && (n(e.compressors.compressor_1_hours) + n(e.compressors.compressor_2_hours))),
            slurryFeed: sum(entries, e => e.slsMachine && n(e.slsMachine.slurry_feed)),
            totalSlurryFeed: sum(entries, e => e.slsMachine && n(e.slsMachine.slurry_feed)),
            wetCakeQty: sum(entries, e => e.slsMachine && n(e.slsMachine.wet_cake_prod)),
            wetCakeTS: avg(entries, e => e.slsMachine && n(e.slsMachine.wet_cake_ts)),
            liquidProduced: sum(entries, e => e.slsMachine && n(e.slsMachine.liquid_produced)),
            liquidSentToLagoon: sum(entries, e => e.slsMachine && n(e.slsMachine.liquid_sent_to_lagoon))
        };

        const fomLfom = {
            lfomQty: sum(entries, e => e.fertilizer && n(e.fertilizer.lagoon_liquid_sold)),
            lfomTS: 0,
            fomProduced: sum(entries, e => e.fertilizer && n(e.fertilizer.fom_produced)),
            fomSold: sum(entries, e => e.fertilizer && n(e.fertilizer.sold))
        };

        const slurryManagement = {
            directPurgeFarmers: 0,
            slsInlet: sum(entries, e => e.slsMachine && n(e.slsMachine.slurry_feed)),
            directPurgeLagoon: sum(entries, e => e.slsMachine && n(e.slsMachine.liquid_sent_to_lagoon)),
            totalSlurryOut: sum(entries, e => (e.digesters || []).reduce((s, d) => s + n(d.discharge_slurry), 0)),
            permeateToMixing: sum(entries, e => e.feedMixingTank && n(e.feedMixingTank.permeate_qty)),
            lfomToLagoon: sum(entries, e => e.fertilizer && n(e.fertilizer.lagoon_liquid_sold)),
            fomDispatch: sum(entries, e => e.fertilizer && n(e.fertilizer.sold)),
            lfomDispatch: sum(entries, e => e.fertilizer && n(e.fertilizer.loose_fom_sold))
        };

        const powerConsumption = sum(entries, e => e.utilities && n(e.utilities.electricity_consumption));
        const breakdownReasons = entries
            .filter(e => e.review_comment)
            .map(e => `${e.date}: ${e.review_comment}`)
            .join('; ') || '';

        res.json({
            startDate,
            endDate,
            entryCount: entries.length,
            feeding,
            rawMaterialQuality,
            digesters: digestersConsolidated,
            digesterAverage: avgDigester,
            biogasQuality,
            biogasProduction,
            cbgQuality,
            cbgKg,
            sls,
            fomLfom,
            slurryManagement,
            powerConsumption,
            breakdownReasons
        });
    } catch (error) {
        console.error('Consolidated Data Error:', error);
        res.status(500).json({ message: 'Error fetching consolidated data', error: error.message });
    }
};

// CBG Sales Breakdown - uses same date range logic as getDashboardData (calendarUtils)
exports.getCBGSalesBreakdown = async (req, res) => {
    try {
        const { period = 'month', startDate: qStart, endDate: qEnd, year: qYear, week: qWeek, month: qMonth } = req.query;
        const now = new Date();
        let startStr;
        let endStr;

        if (qStart && qEnd) {
            startStr = String(qStart).slice(0, 10);
            endStr = String(qEnd).slice(0, 10);
        } else if (period === 'week') {
            const y = qYear != null ? parseInt(qYear, 10) : now.getFullYear();
            const w = qWeek != null ? parseInt(qWeek, 10) : calendarUtils.getCalendarWeek(now);
            const { start, end } = calendarUtils.getCalendarWeekRange(y, w);
            startStr = calendarUtils.toDateString(start);
            endStr = calendarUtils.toDateString(end);
        } else if (period === 'month') {
            const y = qYear != null ? parseInt(qYear, 10) : now.getFullYear();
            const m = qMonth != null ? parseInt(qMonth, 10) : (now.getMonth() + 1);
            const { start, end } = calendarUtils.getMonthRange(y, m);
            startStr = calendarUtils.toDateString(start);
            endStr = calendarUtils.toDateString(end);
        } else if (period === 'year') {
            const y = qYear != null ? parseInt(qYear, 10) : now.getFullYear();
            const { start, end } = calendarUtils.getYearRange(y);
            startStr = calendarUtils.toDateString(start);
            endStr = calendarUtils.toDateString(end);
        } else if (period === 'day') {
            startStr = calendarUtils.toDateString(now);
            endStr = startStr;
        } else {
            startStr = calendarUtils.toDateString(now);
            endStr = startStr;
        }

        const sales = await MISCBGSale.findAll({
            include: [
                {
                    model: MISDailyEntry,
                    as: 'dailyEntry',
                    where: {
                        date: { [Op.between]: [startStr, endStr] },
                        status: { [Op.notIn]: ['deleted'] }
                    },
                    attributes: []
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['name']
                }
            ],
            attributes: [
                'customer_id',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
            ],
            group: ['customer_id', 'customer.id', 'customer.name'],
            order: [[sequelize.literal('totalQuantity'), 'DESC']]
        });

        const formatted = sales.map(s => ({
            customerId: s.customer_id,
            customerName: s.customer?.name || 'Unknown',
            totalQuantity: s.dataValues.totalQuantity || 0
        }));

        res.json(formatted);
    } catch (error) {
        console.error('CBG Sales Breakdown Error:', error);
        res.status(500).json({ message: 'Error fetching breakdown', error: error.message });
    }
};

/** Download Final MIS HTML report for one entry's date (same layout as scheduled/email report). */
exports.downloadEntryFinalMisReport = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await MISDailyEntry.findByPk(id, { attributes: ['id', 'date'] });
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        const dateStr =
            typeof entry.date === 'string'
                ? entry.date.slice(0, 10)
                : entry.date instanceof Date
                  ? entry.date.toISOString().slice(0, 10)
                  : String(entry.date).slice(0, 10);

        const html = await finalMISReportEmailService.buildReportHtmlForRange(dateStr, dateStr, '');
        const filename = `Final_MIS_Report_${dateStr}.html`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
    } catch (error) {
        console.error('downloadEntryFinalMisReport Error:', error);
        res.status(500).json({ message: 'Error generating Final MIS report', error: error.message });
    }
};

module.exports = exports;
