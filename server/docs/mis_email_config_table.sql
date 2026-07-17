-- Optional: create MIS Entry email config table manually if not using Sequelize sync
-- Otherwise the table is created automatically when the server starts (sync).

CREATE TABLE IF NOT EXISTS `mis_email_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `submit_notify_emails` text COMMENT 'JSON array of emails to notify when an MIS entry is submitted',
  `entry_not_created_emails` text COMMENT 'JSON array of emails to notify when no entry is created for the day',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
