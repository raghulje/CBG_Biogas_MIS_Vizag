-- Add audit/entity columns to email_logs for linking emails to audit records
-- Run this if migration 20260219-add-audit-entity-to-email-logs.js does not apply
-- Skip any line if that column already exists

ALTER TABLE email_logs ADD COLUMN audit_log_id INT NULL;
ALTER TABLE email_logs ADD COLUMN entity_type VARCHAR(64) NULL;
ALTER TABLE email_logs ADD COLUMN entity_id VARCHAR(64) NULL;
