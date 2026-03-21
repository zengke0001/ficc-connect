-- ============================================================
-- FICC Connect - Full Database Schema
-- Last updated: 2026-03-21
--
-- This file reflects the complete current schema including all
-- migrations (001, 002, 003). Use this to set up a fresh database.
--
-- Run:  psql -U postgres -d ficc_connect -f 000_full_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Teams / Departments
CREATE TABLE IF NOT EXISTS teams (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7) DEFAULT '#2563EB',
    logo_url    VARCHAR(500),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users
-- Authentication: WeChat mini-app uses openid; PWA uses email + invite code (no password).
-- PWA users get a generated openid prefixed with "pwa_".
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    openid        VARCHAR(100) UNIQUE NOT NULL,               -- WeChat openid or generated PWA identifier
    nickname      VARCHAR(100) NOT NULL,
    avatar_url    VARCHAR(500),
    team_id       UUID REFERENCES teams(id),
    email         VARCHAR(255) UNIQUE,                        -- PWA login email (no password required)
    total_points  INTEGER DEFAULT 0,
    checkin_count INTEGER DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id          UUID REFERENCES users(id),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    cover_image_url     VARCHAR(500),
    status              VARCHAR(20) DEFAULT 'active',         -- active | completed
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    checkin_start_time  TIME DEFAULT '06:00',
    checkin_end_time    TIME DEFAULT '23:59',
    points_per_checkin  INTEGER DEFAULT 10,
    points_per_photo    INTEGER DEFAULT 5,
    allow_late_checkin  BOOLEAN DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity Participants
CREATE TABLE IF NOT EXISTS activity_participants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id     UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_checkins  INTEGER DEFAULT 0,
    total_points    INTEGER DEFAULT 0,
    current_streak  INTEGER DEFAULT 0,
    max_streak      INTEGER DEFAULT 0,
    UNIQUE(activity_id, user_id)
);

-- Check-ins
CREATE TABLE IF NOT EXISTS checkins (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id   UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    checkin_date  DATE NOT NULL,
    checkin_time  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    photo_url     VARCHAR(500),
    comment       TEXT,
    points_earned INTEGER DEFAULT 0,
    location_lat  DECIMAL(10, 8),
    location_lng  DECIMAL(11, 8),
    UNIQUE(activity_id, user_id, checkin_date)
);

-- Photos
-- checkin_id and activity_id are nullable to support general-purpose uploads
-- (e.g. activity cover images uploaded before the activity is created).
CREATE TABLE IF NOT EXISTS photos (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id     UUID REFERENCES checkins(id) ON DELETE CASCADE,
    activity_id    UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    storage_key    VARCHAR(500) NOT NULL,
    url            VARCHAR(500) NOT NULL,
    thumbnail_url  VARCHAR(500),
    width          INTEGER,
    height         INTEGER,
    likes_count    INTEGER DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id   UUID REFERENCES photos(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Achievements / Badges
CREATE TABLE IF NOT EXISTS achievements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon_url        VARCHAR(500),
    condition_type  VARCHAR(50),
    condition_value INTEGER,
    points_reward   INTEGER DEFAULT 0
);

-- User Achievements (junction)
CREATE TABLE IF NOT EXISTS user_achievements (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_last_active_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_last_active ON users;
CREATE TRIGGER update_users_last_active
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active_column();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_openid                  ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_email                   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team                    ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_activities_status             ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_dates              ON activities(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_checkins_activity_user        ON checkins(activity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date                 ON checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_photos_activity               ON photos(activity_id);
CREATE INDEX IF NOT EXISTS idx_photos_user                   ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user    ON activity_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_points  ON activity_participants(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_likes_photo                   ON likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity             ON comments(activity_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default teams
INSERT INTO teams (name, color) VALUES
    ('产品部',   '#2563EB'),
    ('技术部',   '#10B981'),
    ('设计部',   '#8B5CF6'),
    ('运营部',   '#F59E0B'),
    ('市场部',   '#EC4899'),
    ('人力资源', '#06B6D4'),
    ('财务部',   '#6366F1'),
    ('其他',     '#6B7280')
ON CONFLICT DO NOTHING;

-- Default achievements
INSERT INTO achievements (name, description, icon_url, condition_type, condition_value, points_reward) VALUES
    ('First Step',       '完成第一次打卡',           '🌟', 'checkin_count',        1,   10),
    ('On Fire',          '连续打卡7天',              '🔥', 'streak',               7,   50),
    ('Photographer',     '上传10张照片',             '📸', 'photo_count',          10,  30),
    ('Popular',          '收到50个赞',               '❤️', 'likes_received',       50,  50),
    ('Consistent',       '参加5个活动',              '🎯', 'activities_joined',    5,  100),
    ('Champion',         '在活动排行榜获得第一名',    '🏆', 'rank_first',           1,  200),
    ('Social Butterfly', '活动参与人数达到10人',      '👥', 'activity_participants', 10,  50),
    ('Early Bird',       '早上8点前打卡',            '🌅', 'early_checkin',        1,   20)
ON CONFLICT DO NOTHING;
