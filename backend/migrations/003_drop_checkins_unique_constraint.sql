-- Migration: Remove UNIQUE constraint from checkins table for multiple check-ins support
-- Date: 2024

-- SQLite doesn't support DROP CONSTRAINT, so we recreate the table
-- Step 1: Rename old table
ALTER TABLE checkins RENAME TO checkins_old;

-- Step 2: Create new table without UNIQUE constraint on (activity_id, user_id, checkin_date)
CREATE TABLE IF NOT EXISTS checkins (
    id            TEXT PRIMARY KEY,
    activity_id   TEXT REFERENCES activities(id) ON DELETE CASCADE,
    user_id       TEXT REFERENCES users(id) ON DELETE CASCADE,
    checkin_date  DATE NOT NULL,
    checkin_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
    photo_url     VARCHAR(500),
    comment       TEXT,
    points_earned INTEGER DEFAULT 0,
    location_lat  REAL,
    location_lng  REAL
);

-- Step 3: Copy data from old table
INSERT INTO checkins SELECT * FROM checkins_old;

-- Step 4: Drop old table
DROP TABLE checkins_old;
