# Final MIS Report – Database

The **Final MIS Report** uses the **same database and tables** as MIS Entry. **No new tables are required.**

## Tables used by Final MIS

The report API `GET /api/mis-entries/for-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` reads from:

- `mis_daily_entries`
- `mis_raw_materials`
- `mis_feed_mixing_tank`
- `mis_digester_data`
- `mis_sls_data`
- `mis_raw_biogas`
- `mis_raw_biogas_quality`
- `mis_compressed_biogas`
- `mis_compressors`
- `mis_fertilizer_data`
- `mis_utilities`
- `mis_manpower_data`
- `mis_plant_availability`
- `mis_hse_data`

If MIS Entry already works (you can create and view daily entries), these tables exist and **you do not need to run any extra SQL** for Final MIS.

## Setting up the database from scratch

1. **Create the database**
   ```bash
   node server/create_db.js
   ```

2. **Let Sequelize create tables**
   Start the server. If your app uses `sequelize.sync()` (or similar) on startup, the tables will be created automatically.

3. **If you need raw MySQL CREATE TABLE statements**
   - Run the app once with sync so tables are created, then use `SHOW CREATE TABLE <table_name>;` in MySQL for each table, or  
   - Use a tool like `sequelize-auto` to generate SQL from the existing Sequelize models.

No separate SQL script is required for Final MIS; it uses the existing MIS schema.
