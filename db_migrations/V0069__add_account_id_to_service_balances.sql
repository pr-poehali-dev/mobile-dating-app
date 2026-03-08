-- Add account_id column to service_balances table for multi-account support
ALTER TABLE service_balances 
ADD COLUMN IF NOT EXISTS account_id VARCHAR(100);