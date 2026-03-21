-- Migration: Switch from password-based to invite code authentication
-- Created: 2026-03-21
--
-- Changes:
-- 1. Drop password_hash column (no longer used; registration now requires invite code from .env)
-- 2. Update column comments to reflect new auth model

ALTER TABLE users
DROP COLUMN IF EXISTS password_hash;

COMMENT ON COLUMN users.email IS 'Email address (for PWA login - no password required)';
COMMENT ON COLUMN users.openid IS 'WeChat openid (for mini-app) or generated PWA identifier (pwa_<timestamp>_<random>)';
