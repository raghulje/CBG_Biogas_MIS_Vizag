-- Run on MySQL if you deploy without Sequelize migrations.
-- Idempotency for scheduled Final MIS emails (retry until success for same report period).

ALTER TABLE final_mis_report_config
  ADD COLUMN last_successful_period_end VARCHAR(10) NULL
  COMMENT 'YYYY-MM-DD end of report period last delivered by scheduler';
