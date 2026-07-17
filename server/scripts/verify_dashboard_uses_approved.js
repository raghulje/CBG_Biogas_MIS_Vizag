#!/usr/bin/env node
/**
 * Quick verification script:
 * - Creates three MISDailyEntry rows for the same date with statuses: draft, submitted, approved
 * - Calls the dashboard controller to fetch dashboard data for that date range
 * - Asserts that only the approved entry contributes to the dashboard totals
 *
 * Usage:
 *   node server/scripts/verify_dashboard_uses_approved.js
 *
 * NOTE: Run against a non-production DB.
 */
(async function main() {
  try {
    const path = require('path');
    const db = require(path.join('..', 'models'));
    const { MISDailyEntry, MISRawBiogas, MISCompressedBiogas, sequelize } = db;
    const misExtensions = require(path.join('..', 'controllers', 'misControllerExtensions'));
    const Op = db.Sequelize.Op;

    await sequelize.authenticate();

    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);

    // Helper to create an entry with minimal child data
    async function createEntry(status, rawBiogasVal = 0, cbgProduced = 0) {
      const t = await sequelize.transaction();
      try {
        const entry = await MISDailyEntry.create({ date: dateStr, status, created_by: 1 }, { transaction: t });
        await MISRawBiogas.create({ entry_id: entry.id, total_raw_biogas: rawBiogasVal }, { transaction: t });
        await MISCompressedBiogas.create({ entry_id: entry.id, produced: cbgProduced }, { transaction: t });
        await t.commit();
        return entry;
      } catch (e) {
        await t.rollback();
        throw e;
      }
    }

    console.log('Creating test entries (draft, submitted, approved)...');
    const draft = await createEntry('draft', 10, 5);
    const submitted = await createEntry('submitted', 20, 10);
    const approved = await createEntry('approved', 30, 15);

    // Fake req/res
    const req = { query: { startDate: dateStr, endDate: dateStr }, user: { id: 1 } };
    let captured = null;
    const res = {
      json(obj) { captured = obj; },
      status(code) { return { json(obj) { captured = obj; } }; }
    };

    console.log('Calling dashboard controller...');
    await misExtensions.getDashboardData(req, res);

    if (!captured || !captured.summary) {
      console.error('Dashboard did not return expected shape:', captured);
      process.exit(2);
    }

    const totalEntries = captured.summary.totalEntries;
    console.log('Dashboard totalEntries:', totalEntries);

    if (totalEntries !== 1) {
      console.error('Test failed: expected 1 approved entry to be counted, got', totalEntries);
      process.exit(3);
    }

    // Verify totals correspond to the approved entry (rawBiogas + compressed)
    const expectedRawBiogas = 30;
    const expectedCBG = 15;
    if (Number(captured.summary.totalRawBiogas) !== expectedRawBiogas) {
      console.error('Raw biogas mismatch. Expected', expectedRawBiogas, 'got', captured.summary.totalRawBiogas);
      process.exit(4);
    }
    if (Number(captured.summary.totalCBGProduced) !== expectedCBG) {
      console.error('CBG produced mismatch. Expected', expectedCBG, 'got', captured.summary.totalCBGProduced);
      process.exit(5);
    }

    console.log('Test passed: dashboard uses only approved entries.');

    // Cleanup
    await MISRawBiogas.destroy({ where: { entry_id: [draft.id, submitted.id, approved.id] } });
    await MISCompressedBiogas.destroy({ where: { entry_id: [draft.id, submitted.id, approved.id] } });
    await MISDailyEntry.destroy({ where: { id: [draft.id, submitted.id, approved.id] } });

    process.exit(0);
  } catch (err) {
    console.error('verify_dashboard_uses_approved failed:', err);
    process.exit(1);
  }
})();

