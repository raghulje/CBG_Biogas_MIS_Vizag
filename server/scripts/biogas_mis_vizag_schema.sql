-- Full schema for biogas_mis_vizag, generated from Sequelize models.
-- Import into the empty production database. This drops and recreates every app table.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `app_config`;
CREATE TABLE IF NOT EXISTS `app_config` (`id` INTEGER NOT NULL auto_increment , `key` VARCHAR(255) NOT NULL UNIQUE, `value` TEXT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (`id` INTEGER NOT NULL auto_increment , `user_id` INTEGER, `action` VARCHAR(255) NOT NULL, `resource_type` VARCHAR(255), `resource_id` VARCHAR(255), `old_values` JSON, `new_values` JSON, `ip_address` VARCHAR(255), `user_agent` VARCHAR(255), `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `audit_logs_created_at` ON `audit_logs` (`created_at`);

DROP TABLE IF EXISTS `customers`;
CREATE TABLE IF NOT EXISTS `customers` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL, `type` VARCHAR(255) COMMENT 'Type of customer (e.g., Industrial, Commercial, Residential)', `email` VARCHAR(255), `phone` VARCHAR(255), `address` TEXT, `gst_number` VARCHAR(255), `pan_number` VARCHAR(255), `status` ENUM('active', 'inactive') DEFAULT 'active', `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, `deleted_at` DATETIME, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE IF NOT EXISTS `email_logs` (`id` INTEGER NOT NULL auto_increment , `recipient` VARCHAR(255), `subject` VARCHAR(255), `status` ENUM('sent', 'failed') DEFAULT 'sent', `error_message` TEXT, `sent_at` DATETIME, `audit_log_id` INTEGER, `entity_type` VARCHAR(64), `entity_id` VARCHAR(64), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `email_schedulers`;
CREATE TABLE IF NOT EXISTS `email_schedulers` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL, `cron_expression` VARCHAR(255) NOT NULL DEFAULT '0 9 * * *', `is_active` TINYINT(1) DEFAULT 1, `job_type` VARCHAR(255) NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `email_templates`;
CREATE TABLE IF NOT EXISTS `email_templates` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL, `subject` VARCHAR(255) NOT NULL, `body` TEXT NOT NULL COMMENT 'Supports variables {{user_name}}, {{entry_date}}, etc.', `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ux_email_templates_name` ON `email_templates` (`name`);

DROP TABLE IF EXISTS `final_mis_report_config`;
CREATE TABLE IF NOT EXISTS `final_mis_report_config` (`id` INTEGER NOT NULL auto_increment , `to_emails` TEXT NOT NULL, `subject` VARCHAR(255) NOT NULL DEFAULT 'Final MIS Report', `body` TEXT COMMENT 'Optional HTML body intro before the report table', `schedule_type` ENUM('daily', 'weekly', 'monthly', 'quarterly', 'custom') NOT NULL DEFAULT 'monthly', `schedule_time` VARCHAR(10) DEFAULT '09:00' COMMENT 'Time of day HH:MM (24h) for daily/weekly/monthly/quarterly', `cron_expression` VARCHAR(64) COMMENT 'For schedule_type=custom, e.g. 0 9 * * 1 for Monday 9 AM', `is_active` TINYINT(1) DEFAULT 1, `last_sent_at` DATETIME, `last_successful_period_end` VARCHAR(10) COMMENT 'YYYY-MM-DD end of report period last delivered by scheduler (idempotency + retries)', `schedule_failure_period_end` VARCHAR(10) COMMENT 'Period end (YYYY-MM-DD) for last failed scheduled delivery attempt', `schedule_failure_summary` VARCHAR(512), `schedule_failure_last_attempt_at` DATETIME, `delivery_alert_sent_for_period` VARCHAR(10) COMMENT 'One-time failure alert email sent for this period end', `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `import_logs`;
CREATE TABLE IF NOT EXISTS `import_logs` (`id` INTEGER NOT NULL auto_increment , `filename` VARCHAR(255), `status` ENUM('success', 'failed', 'partial') NOT NULL, `records_processed` INTEGER, `records_failed` INTEGER, `error_log` JSON, `imported_by` INTEGER, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_biogas_data`;
CREATE TABLE IF NOT EXISTS `mis_biogas_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `parameter` VARCHAR(255), `value` FLOAT, `unit` VARCHAR(255), `time` TIME, `remarks` TEXT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_cbg_sales`;
CREATE TABLE IF NOT EXISTS `mis_cbg_sales` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `customer_id` INTEGER NOT NULL, `quantity` FLOAT NOT NULL DEFAULT 0, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_compressed_biogas`;
CREATE TABLE IF NOT EXISTS `mis_compressed_biogas` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `produced` FLOAT, `ch4` FLOAT, `co2` FLOAT, `h2s` FLOAT, `o2` FLOAT, `n2` FLOAT, `conversion_ratio` FLOAT, `ch4_slippage` FLOAT, `cbg_stock` FLOAT, `cbg_sold` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_compressed_biogas_entry_id` ON `mis_compressed_biogas` (`entry_id`);

DROP TABLE IF EXISTS `mis_compressors`;
CREATE TABLE IF NOT EXISTS `mis_compressors` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `compressor_1_hours` FLOAT, `compressor_2_hours` FLOAT, `total_hours` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_daily_entries`;
CREATE TABLE IF NOT EXISTS `mis_daily_entries` (`id` INTEGER NOT NULL auto_increment , `date` DATE NOT NULL, `shift` ENUM('Shift-1', 'Shift-2', 'General') DEFAULT 'General', `status` ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'deleted') DEFAULT 'draft', `review_comment` TEXT, `created_by` INTEGER NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ux_mis_daily_entries_date_shift` ON `mis_daily_entries` (`date`, `shift`);
CREATE INDEX `idx_mis_daily_entries_date` ON `mis_daily_entries` (`date`);
CREATE INDEX `idx_mis_daily_entries_status` ON `mis_daily_entries` (`status`);
CREATE INDEX `idx_mis_daily_entries_created_by` ON `mis_daily_entries` (`created_by`);

DROP TABLE IF EXISTS `mis_digester_data`;
CREATE TABLE IF NOT EXISTS `mis_digester_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `digester_name` VARCHAR(255), `feeding_slurry` FLOAT, `feeding_ts_percent` FLOAT, `feeding_vs_percent` FLOAT, `discharge_slurry` FLOAT, `discharge_ts_percent` FLOAT, `discharge_vs_percent` FLOAT, `temp` FLOAT, `ph` FLOAT, `pressure` FLOAT, `lignin` FLOAT, `vfa` FLOAT, `alkalinity` FLOAT, `vfa_alk_ratio` FLOAT, `ash` FLOAT, `density` FLOAT, `slurry_level` FLOAT, `agitator_runtime` INTEGER, `agitator_condition` VARCHAR(255), `hrt` FLOAT, `vs_destruction` FLOAT, `olr` FLOAT, `balloon_level` FLOAT, `foaming_level` FLOAT, `remarks` TEXT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_digester_data_entry_id` ON `mis_digester_data` (`entry_id`);

DROP TABLE IF EXISTS `mis_email_config`;
CREATE TABLE IF NOT EXISTS `mis_email_config` (`id` INTEGER auto_increment , `submit_notify_emails` TEXT COMMENT 'JSON array of email addresses', `entry_not_created_emails` TEXT COMMENT 'JSON array of email addresses', `not_submitted_notify_emails` TEXT COMMENT 'JSON array of email addresses', `escalation_notify_emails` TEXT COMMENT 'JSON array of email addresses', PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_feed_data`;
CREATE TABLE IF NOT EXISTS `mis_feed_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `feed_type` VARCHAR(255), `quantity` FLOAT, `time` TIME, `remarks` TEXT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_feed_mixing_tank`;
CREATE TABLE IF NOT EXISTS `mis_feed_mixing_tank` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `cow_dung_qty` FLOAT, `cow_dung_ts` FLOAT, `cow_dung_vs` FLOAT, `pressmud_qty` FLOAT, `pressmud_ts` FLOAT, `pressmud_vs` FLOAT, `permeate_qty` FLOAT, `permeate_ts` FLOAT, `permeate_vs` FLOAT, `water_qty` FLOAT, `water_ts` FLOAT, `water_vs` FLOAT, `pulp_qty` FLOAT, `pulp_ts` FLOAT, `pulp_vs` FLOAT, `maggie_qty` FLOAT, `maggie_ts` FLOAT, `maggie_vs` FLOAT, `other_feed_substrate_qty` FLOAT, `other_feed_substrate_ts` FLOAT, `other_feed_substrate_vs` FLOAT, `slurry_total` FLOAT, `slurry_ts` FLOAT, `slurry_vs` FLOAT, `slurry_ph` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_feed_mixing_tank_entry_id` ON `mis_feed_mixing_tank` (`entry_id`);

DROP TABLE IF EXISTS `mis_fertilizer_data`;
CREATE TABLE IF NOT EXISTS `mis_fertilizer_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `fom_produced` FLOAT, `inventory` FLOAT, `sold` FLOAT, `weighted_average` FLOAT, `revenue_1` FLOAT, `lagoon_liquid_sold` FLOAT, `revenue_2` FLOAT, `loose_fom_sold` FLOAT, `revenue_3` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_fertilizer_data_entry_id` ON `mis_fertilizer_data` (`entry_id`);

DROP TABLE IF EXISTS `mis_fuel_utilized`;
CREATE TABLE IF NOT EXISTS `mis_fuel_utilized` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `fuel_type` VARCHAR(255) NOT NULL COMMENT 'Petrol or Diesel', `customer_id` INTEGER NOT NULL, `quantity` FLOAT NOT NULL DEFAULT 0, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_hse_data`;
CREATE TABLE IF NOT EXISTS `mis_hse_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `safety_lti` INTEGER, `near_misses` INTEGER, `first_aid` INTEGER, `reportable_incidents` INTEGER, `mti` INTEGER, `other_incidents` INTEGER, `fatalities` INTEGER, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_hse_data_entry_id` ON `mis_hse_data` (`entry_id`);

DROP TABLE IF EXISTS `mis_manpower_data`;
CREATE TABLE IF NOT EXISTS `mis_manpower_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `refex_srel_staff` INTEGER, `third_party_staff` INTEGER, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_plant_availability`;
CREATE TABLE IF NOT EXISTS `mis_plant_availability` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `working_hours` FLOAT, `scheduled_downtime` FLOAT, `unscheduled_downtime` FLOAT, `total_availability` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_plant_availability_entry_id` ON `mis_plant_availability` (`entry_id`);

DROP TABLE IF EXISTS `mis_power_data`;
CREATE TABLE IF NOT EXISTS `mis_power_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `equipment_name` VARCHAR(255), `start_time` TIME, `end_time` TIME, `total_hours` FLOAT, `energy_consumed` FLOAT, `remarks` TEXT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_raw_biogas`;
CREATE TABLE IF NOT EXISTS `mis_raw_biogas` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `digester_01_gas` FLOAT, `digester_02_gas` FLOAT, `digester_03_gas` FLOAT, `total_raw_biogas` FLOAT, `rbg_flared` FLOAT, `gas_yield` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_raw_biogas_entry_id` ON `mis_raw_biogas` (`entry_id`);

DROP TABLE IF EXISTS `mis_raw_biogas_quality`;
CREATE TABLE IF NOT EXISTS `mis_raw_biogas_quality` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `ch4` FLOAT, `co2` FLOAT, `h2s` FLOAT, `o2` FLOAT, `n2` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mis_raw_materials`;
CREATE TABLE IF NOT EXISTS `mis_raw_materials` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `cow_dung_purchased` FLOAT, `cow_dung_stock` FLOAT, `old_press_mud_opening_balance` FLOAT, `old_press_mud_purchased` FLOAT, `old_press_mud_degradation_loss` FLOAT, `old_press_mud_closing_stock` FLOAT, `new_press_mud_purchased` FLOAT, `press_mud_used` FLOAT, `total_press_mud_stock` FLOAT, `audit_note` TEXT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_raw_materials_entry_id` ON `mis_raw_materials` (`entry_id`);

DROP TABLE IF EXISTS `mis_sls_data`;
CREATE TABLE IF NOT EXISTS `mis_sls_data` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `water_consumption` FLOAT, `poly_electrolyte` FLOAT, `solution` FLOAT, `slurry_feed` FLOAT, `wet_cake_prod` FLOAT, `wet_cake_ts` FLOAT, `wet_cake_vs` FLOAT, `liquid_produced` FLOAT, `liquid_ts` FLOAT, `liquid_vs` FLOAT, `liquid_sent_to_lagoon` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_sls_data_entry_id` ON `mis_sls_data` (`entry_id`);

DROP TABLE IF EXISTS `mis_utilities`;
CREATE TABLE IF NOT EXISTS `mis_utilities` (`id` INTEGER NOT NULL auto_increment , `entry_id` INTEGER NOT NULL, `electricity_consumption` FLOAT, `specific_power_consumption` FLOAT, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `mis_utilities_entry_id` ON `mis_utilities` (`entry_id`);

DROP TABLE IF EXISTS `notification_schedules`;
CREATE TABLE IF NOT EXISTS `notification_schedules` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(100) NOT NULL DEFAULT 'Reminder', `mis_start_time` TIME NOT NULL, `mis_end_time` TIME NOT NULL, `reminder_start_time` TIME NOT NULL, `reminder_interval_minutes` INTEGER NOT NULL DEFAULT 60, `reminder_count` INTEGER NOT NULL DEFAULT 4, `is_active` TINYINT(1) NOT NULL DEFAULT 1, `target_role` VARCHAR(50), `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (`id` INTEGER NOT NULL auto_increment , `user_id` INTEGER NOT NULL, `token` VARCHAR(255) NOT NULL, `expires_at` DATETIME NOT NULL, `used` TINYINT(1) DEFAULT 0, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ux_password_reset_tokens_token` ON `password_reset_tokens` (`token`);

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL COMMENT 'e.g., mis_entry:create, report:view', `description` VARCHAR(255), `resource` VARCHAR(255) NOT NULL, `action` VARCHAR(255) NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ux_permissions_name` ON `permissions` (`name`);

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL, `description` VARCHAR(255), `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ux_roles_name` ON `roles` (`name`);

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE IF NOT EXISTS `role_permissions` (`role_id` INTEGER , `permission_id` INTEGER , PRIMARY KEY (`role_id`, `permission_id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `role_permissions_role_id_permission_id` ON `role_permissions` (`role_id`, `permission_id`);

DROP TABLE IF EXISTS `smtp_configs`;
CREATE TABLE IF NOT EXISTS `smtp_configs` (`id` INTEGER NOT NULL auto_increment , `host` VARCHAR(255) NOT NULL, `port` INTEGER DEFAULT 587, `secure` TINYINT(1) DEFAULT 0, `auth_user` VARCHAR(255) NOT NULL, `auth_pass` VARCHAR(255) NOT NULL, `from_email` VARCHAR(255) NOT NULL, `is_active` TINYINT(1) DEFAULT 1, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL, `email` VARCHAR(255) NOT NULL, `password` VARCHAR(255) NOT NULL, `role_id` INTEGER NOT NULL, `is_active` TINYINT(1) DEFAULT 1, `is_custom_perm` TINYINT(1) DEFAULT 0, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ux_users_email` ON `users` (`email`);
CREATE INDEX `idx_users_role_id` ON `users` (`role_id`);

DROP TABLE IF EXISTS `user_activity_logs`;
CREATE TABLE IF NOT EXISTS `user_activity_logs` (`id` INTEGER NOT NULL auto_increment , `user_id` INTEGER, `activity_type` VARCHAR(255) NOT NULL, `description` TEXT, `metadata` JSON, `ip_address` VARCHAR(255), `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE IF NOT EXISTS `user_permissions` (`user_id` INTEGER NOT NULL , `permission_id` INTEGER NOT NULL , PRIMARY KEY (`user_id`, `permission_id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ux_user_permissions_user_id_permission_id` ON `user_permissions` (`user_id`, `permission_id`);
CREATE INDEX `idx_user_permissions_user_id` ON `user_permissions` (`user_id`);

ALTER TABLE `audit_logs` ADD CONSTRAINT `fk_audit_logs_user_id_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `import_logs` ADD CONSTRAINT `fk_import_logs_imported_by_1` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `mis_biogas_data` ADD CONSTRAINT `fk_mis_biogas_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_cbg_sales` ADD CONSTRAINT `fk_mis_cbg_sales_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `mis_cbg_sales` ADD CONSTRAINT `fk_mis_cbg_sales_customer_id_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `mis_compressed_biogas` ADD CONSTRAINT `fk_mis_compressed_biogas_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_compressors` ADD CONSTRAINT `fk_mis_compressors_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_daily_entries` ADD CONSTRAINT `fk_mis_daily_entries_created_by_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `mis_digester_data` ADD CONSTRAINT `fk_mis_digester_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_feed_data` ADD CONSTRAINT `fk_mis_feed_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_feed_mixing_tank` ADD CONSTRAINT `fk_mis_feed_mixing_tank_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_fertilizer_data` ADD CONSTRAINT `fk_mis_fertilizer_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_fuel_utilized` ADD CONSTRAINT `fk_mis_fuel_utilized_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_fuel_utilized` ADD CONSTRAINT `fk_mis_fuel_utilized_customer_id_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `mis_hse_data` ADD CONSTRAINT `fk_mis_hse_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_manpower_data` ADD CONSTRAINT `fk_mis_manpower_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_plant_availability` ADD CONSTRAINT `fk_mis_plant_availability_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_power_data` ADD CONSTRAINT `fk_mis_power_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_raw_biogas` ADD CONSTRAINT `fk_mis_raw_biogas_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_raw_biogas_quality` ADD CONSTRAINT `fk_mis_raw_biogas_quality_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_raw_materials` ADD CONSTRAINT `fk_mis_raw_materials_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_sls_data` ADD CONSTRAINT `fk_mis_sls_data_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mis_utilities` ADD CONSTRAINT `fk_mis_utilities_entry_id_1` FOREIGN KEY (`entry_id`) REFERENCES `mis_daily_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `fk_password_reset_tokens_user_id_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_role_id_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_permission_id_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `fk_users_role_id_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_activity_logs` ADD CONSTRAINT `fk_user_activity_logs_user_id_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `user_permissions` ADD CONSTRAINT `fk_user_permissions_user_id_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_permissions` ADD CONSTRAINT `fk_user_permissions_permission_id_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX `idx_customers_status` ON `customers` (`status`);
CREATE INDEX `idx_customers_type` ON `customers` (`type`);
CREATE INDEX `idx_customers_name` ON `customers` (`name`);
CREATE INDEX `idx_mis_compressors_entry_id` ON `mis_compressors` (`entry_id`);
CREATE INDEX `idx_mis_manpower_entry_id` ON `mis_manpower_data` (`entry_id`);
CREATE INDEX `idx_mis_raw_biogas_quality_entry_id` ON `mis_raw_biogas_quality` (`entry_id`);
CREATE INDEX `idx_email_logs_sent_at` ON `email_logs` (`sent_at`);
CREATE INDEX `idx_email_logs_entity_type` ON `email_logs` (`entity_type`);
CREATE INDEX `idx_user_activity_logs_user_id` ON `user_activity_logs` (`user_id`);
CREATE INDEX `idx_user_activity_logs_created_at` ON `user_activity_logs` (`created_at`);
CREATE INDEX `idx_audit_logs_user_id` ON `audit_logs` (`user_id`);
CREATE INDEX `idx_audit_logs_action` ON `audit_logs` (`action`);

CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260212-add-named-unique-indexes.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260212-baseline-schema.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260212-create-notification-schedule.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260212-fix-mis-daily-entry-indexes.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260213-add-fields-to-notification-schedules.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260213-fk-cascade-mis-children.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260217-create-customers-and-cbg-sales.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260218-create-fuel-utilized.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260219-add-audit-entity-to-email-logs.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260507-add-feed-mixing-tank-new-substrates.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260511120000-add-last-successful-period-final-mis.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260511200000-final-mis-schedule-failure-tracking.js');
INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20260715180000-add-performance-indexes.js');

-- Starter roles, permissions, and login users. Change these passwords after first login.
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'System Administrator', NOW(), NOW()),
(2, 'Manager', 'Plant Manager', NOW(), NOW()),
(3, 'Operator', 'Data Entry Operator', NOW(), NOW());

INSERT INTO `permissions` (`name`, `resource`, `action`, `created_at`, `updated_at`) VALUES
('mis_entry:create', 'mis_entry', 'create', NOW(), NOW()),
('mis_entry:read', 'mis_entry', 'read', NOW(), NOW()),
('mis_entry:update', 'mis_entry', 'update', NOW(), NOW()),
('mis_entry:delete', 'mis_entry', 'delete', NOW(), NOW()),
('mis_entry:submit', 'mis_entry', 'submit', NOW(), NOW()),
('mis_entry:approve', 'mis_entry', 'approve', NOW(), NOW()),
('mis_entry:import', 'mis_entry', 'import', NOW(), NOW()),
('mis_entry:export', 'mis_entry', 'export', NOW(), NOW()),
('user:read', 'user', 'read', NOW(), NOW()),
('user:create', 'user', 'create', NOW(), NOW()),
('user:update', 'user', 'update', NOW(), NOW()),
('user:delete', 'user', 'delete', NOW(), NOW()),
('role:read', 'role', 'read', NOW(), NOW()),
('role:create', 'role', 'create', NOW(), NOW()),
('role:update', 'role', 'update', NOW(), NOW()),
('role:delete', 'role', 'delete', NOW(), NOW()),
('config:read', 'config', 'read', NOW(), NOW()),
('config:create', 'config', 'create', NOW(), NOW()),
('config:update', 'config', 'update', NOW(), NOW()),
('config:delete', 'config', 'delete', NOW(), NOW()),
('audit:read', 'audit', 'read', NOW(), NOW());

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `permissions` WHERE `resource` IN ('mis_entry', 'audit');
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, `id` FROM `permissions` WHERE `resource` = 'mis_entry' AND `action` IN ('create', 'read', 'update', 'submit');

INSERT INTO `users` (`name`, `email`, `password`, `role_id`, `is_active`, `is_custom_perm`, `created_at`, `updated_at`) VALUES
('Super Admin', 'admin@biogas.com', '$2b$10$S3jrD2ID9Q5zRTPRXYjXtOEW7l7tGxU4WNOYC69j6bu4CRmC1LCpS', 1, 1, 0, NOW(), NOW()),
('Jane Manager', 'manager@biogas.com', '$2b$10$ZPewvIRy0YHaFiEDsjl9ruv/Lho1o/RUxjWb2KOACR7u5PbjAzijK', 2, 1, 0, NOW(), NOW()),
('John Operator', 'operator@biogas.com', '$2b$10$ZPewvIRy0YHaFiEDsjl9ruv/Lho1o/RUxjWb2KOACR7u5PbjAzijK', 3, 1, 0, NOW(), NOW());

INSERT INTO `email_schedulers` (`name`, `cron_expression`, `is_active`, `job_type`, `created_at`, `updated_at`) VALUES
('MIS Entry Creation Check', '45 16 * * *', 1, 'mis_creation_check', NOW(), NOW()),
('MIS Escalation Check', '30 17 * * *', 1, 'mis_escalation_check', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
