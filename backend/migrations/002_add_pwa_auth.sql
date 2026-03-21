-- Migration: Add PWA authentication support
-- Created: 2025-03-21

-- Add email and password_hash columns to users table for PWA auth
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make openid nullable for PWA users (they use email instead)
-- Note: We keep existing NOT NULL constraint for backwards compatibility
-- PWA users will have a generated openid

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update comment
COMMENT ON COLUMN users.openid IS 'WeChat openid (for mini-app) or generated PWA identifier';
COMMENT ON COLUMN users.email IS 'Email address (for PWA login)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (for PWA login)';
