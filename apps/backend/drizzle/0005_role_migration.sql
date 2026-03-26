-- Migration: Expand admin_role enum from 3 values to 5 values
-- Old: user, super_admin, dev_admin
-- New: owner, admin, member, viewer, guest

-- Step 1: Add new values to the enum
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'guest';

-- Step 2: Migrate existing data
UPDATE profiles SET admin_role = 'owner' WHERE admin_role = 'super_admin';
UPDATE profiles SET admin_role = 'admin' WHERE admin_role = 'dev_admin';
UPDATE profiles SET admin_role = 'member' WHERE admin_role = 'user' OR admin_role IS NULL;

-- Note: PostgreSQL doesn't support removing enum values.
-- The old values (user, super_admin, dev_admin) remain in the enum type
-- but will not be used by the application going forward.
-- This is safe — unused enum values don't affect functionality.
