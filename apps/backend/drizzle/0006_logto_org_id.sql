-- Add logto_org_id column to teams table for Logto Organizations ↔ Teams sync
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logto_org_id TEXT;
