-- Optional: create Final MIS Report email config table manually if not using Sequelize sync
-- Normally the table is created automatically when the server starts (sync).

CREATE TABLE IF NOT EXISTS final_mis_report_config (
  id INT PRIMARY KEY DEFAULT 1,
  to_emails TEXT NOT NULL DEFAULT '[]',
  subject VARCHAR(255) NOT NULL DEFAULT 'Final MIS Report',
  body TEXT,
  schedule_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'custom') NOT NULL DEFAULT 'monthly',
  schedule_time VARCHAR(10) DEFAULT '09:00',
  cron_expression VARCHAR(64),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_sent_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
