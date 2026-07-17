-- Optional manual migration (MySQL) if Sequelize migrations are not used.
-- Tracks failed scheduled Final MIS deliveries + one-time alert email guard.

ALTER TABLE final_mis_report_config
  ADD COLUMN schedule_failure_period_end VARCHAR(10) NULL COMMENT 'Period end (YYYY-MM-DD) for last failed scheduled delivery',
  ADD COLUMN schedule_failure_summary VARCHAR(512) NULL,
  ADD COLUMN schedule_failure_last_attempt_at DATETIME NULL,
  ADD COLUMN delivery_alert_sent_for_period VARCHAR(10) NULL COMMENT 'Period for which failure alert email was sent';
