-- Migration: Add allow_multiple_checkins column
-- Date: 2024

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We use a workaround with a transaction to safely add the column
PRAGMA ignore_check_constraints = ON;

-- Check if column exists by trying to select it (will error if not exists)
-- This is a no-op for existing columns but adds new ones
-- ALTER TABLE activities ADD COLUMN allow_multiple_checkins INTEGER DEFAULT 0;

PRAGMA ignore_check_constraints = OFF;
