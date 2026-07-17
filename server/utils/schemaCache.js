/**
 * Cached schema lookups to avoid describeTable / INFORMATION_SCHEMA on every request.
 * Cache is process-lifetime; restart after migrations that add columns.
 */
const { sequelize } = require('../models');

const cache = new Map();

/**
 * @param {string} tableName
 * @returns {Promise<Record<string, object>|null>}
 */
async function describeTableCached(tableName) {
    if (cache.has(tableName)) {
        return cache.get(tableName);
    }
    try {
        const qi = sequelize.getQueryInterface();
        const table = await qi.describeTable(tableName);
        cache.set(tableName, table || {});
        return cache.get(tableName);
    } catch (_e) {
        cache.set(tableName, null);
        return null;
    }
}

/**
 * Feed mixing tank column list that exists in DB (migration-safe).
 * @returns {Promise<string[]|undefined>}
 */
async function getFeedMixingTankAttributes() {
    const table = await describeTableCached('mis_feed_mixing_tank');
    if (!table) {
        return [
            'id', 'entry_id',
            'cow_dung_qty', 'cow_dung_ts', 'cow_dung_vs',
            'pressmud_qty', 'pressmud_ts', 'pressmud_vs',
            'permeate_qty', 'permeate_ts', 'permeate_vs',
            'water_qty',
            'slurry_total', 'slurry_ts', 'slurry_vs', 'slurry_ph',
            'created_at', 'updated_at'
        ];
    }
    const keys = Object.keys(table);
    const wanted = [
        'id', 'entry_id',
        'cow_dung_qty', 'cow_dung_ts', 'cow_dung_vs',
        'pressmud_qty', 'pressmud_ts', 'pressmud_vs',
        'permeate_qty', 'permeate_ts', 'permeate_vs',
        'water_qty', 'water_ts', 'water_vs',
        'pulp_qty', 'pulp_ts', 'pulp_vs',
        'maggie_qty', 'maggie_ts', 'maggie_vs',
        'other_feed_substrate_qty', 'other_feed_substrate_ts', 'other_feed_substrate_vs',
        'slurry_total', 'slurry_ts', 'slurry_vs', 'slurry_ph',
        'created_at', 'updated_at'
    ];
    return wanted.filter((c) => keys.includes(c));
}

function clearSchemaCache() {
    cache.clear();
}

module.exports = {
    describeTableCached,
    getFeedMixingTankAttributes,
    clearSchemaCache
};
