# Manual database scripts

Use these when you prefer to update the database yourself instead of running Sequelize migrations (e.g. in production).

## Fuel Utilized table

**File:** `create-fuel-utilized-table.sql`

Creates the `mis_fuel_utilized` table required for the "Fuel Utilized" section (Petrol / Diesel) on the MIS Entry form.

**How to run:**

```bash
# MySQL CLI (replace with your connection details)
mysql -u YOUR_USER -p YOUR_DATABASE < server/scripts/create-fuel-utilized-table.sql
```

Or run the SQL inside the file in your DB client (MySQL Workbench, DBeaver, etc.).

**Note:** The app does **not** run migrations or sync on startup. Tables are expected to exist; create or alter them manually when you deploy schema changes.
