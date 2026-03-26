-- ============================================================
-- FICC Connect - SQLite Schema
-- Converted from PostgreSQL to SQLite
-- ============================================================

-- Enable foreign keys (must be done on each connection)
PRAGMA foreign_keys = ON;

-- ============================================================
-- TABLES
-- ============================================================

-- Teams / Departments
CREATE TABLE IF NOT EXISTS teams (
    id          TEXT PRIMARY KEY,  -- UUID as TEXT
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7) DEFAULT '#2563EB',
    logo_url    VARCHAR(500),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users
-- Authentication: WeChat mini-app uses openid; PWA uses email + invite code (no password).
-- PWA users get a generated openid prefixed with "pwa_".
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,  -- UUID as TEXT
    openid        VARCHAR(100) UNIQUE NOT NULL,               -- WeChat openid or generated PWA identifier
    nickname      VARCHAR(100) NOT NULL,
    avatar_url    VARCHAR(500),
    team_id       TEXT REFERENCES teams(id),
    email         VARCHAR(255) UNIQUE,                        -- PWA login email (no password required)
    total_points  INTEGER DEFAULT 0,
    checkin_count INTEGER DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    id                  TEXT PRIMARY KEY,  -- UUID as TEXT
    creator_id          TEXT REFERENCES users(id),
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
    allow_late_checkin  INTEGER DEFAULT 0,  -- BOOLEAN as INTEGER (0/1)
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity Participants
CREATE TABLE IF NOT EXISTS activity_participants (
    id              TEXT PRIMARY KEY,  -- UUID as TEXT
    activity_id     TEXT REFERENCES activities(id) ON DELETE CASCADE,
    user_id         TEXT REFERENCES users(id) ON DELETE CASCADE,
    joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_checkins  INTEGER DEFAULT 0,
    total_points    INTEGER DEFAULT 0,
    current_streak  INTEGER DEFAULT 0,
    max_streak      INTEGER DEFAULT 0,
    UNIQUE(activity_id, user_id)
);

-- Check-ins
CREATE TABLE IF NOT EXISTS checkins (
    id            TEXT PRIMARY KEY,  -- UUID as TEXT
    activity_id   TEXT REFERENCES activities(id) ON DELETE CASCADE,
    user_id       TEXT REFERENCES users(id) ON DELETE CASCADE,
    checkin_date  DATE NOT NULL,
    checkin_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
    photo_url     VARCHAR(500),
    comment       TEXT,
    points_earned INTEGER DEFAULT 0,
    location_lat  REAL,
    location_lng  REAL,
    UNIQUE(activity_id, user_id, checkin_date)
);

-- Photos
-- checkin_id and activity_id are nullable to support general-purpose uploads
CREATE TABLE IF NOT EXISTS photos (
    id             TEXT PRIMARY KEY,  -- UUID as TEXT
    checkin_id     TEXT REFERENCES checkins(id) ON DELETE CASCADE,
    activity_id    TEXT REFERENCES activities(id) ON DELETE CASCADE,
    user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
    storage_key    VARCHAR(500) NOT NULL,
    url            VARCHAR(500) NOT NULL,
    thumbnail_url  VARCHAR(500),
    width          INTEGER,
    height         INTEGER,
    likes_count    INTEGER DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
    id         TEXT PRIMARY KEY,  -- UUID as TEXT
    photo_id   TEXT REFERENCES photos(id) ON DELETE CASCADE,
    user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id          TEXT PRIMARY KEY,  -- UUID as TEXT
    activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Achievements / Badges
CREATE TABLE IF NOT EXISTS achievements (
    id              TEXT PRIMARY KEY,  -- UUID as TEXT
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon_url        VARCHAR(500),
    condition_type  VARCHAR(50),
    condition_value INTEGER,
    points_reward   INTEGER DEFAULT 0
);

-- User Achievements (junction)
CREATE TABLE IF NOT EXISTS user_achievements (
    id             TEXT PRIMARY KEY,  -- UUID as TEXT
    user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_dates ON activities(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_checkins_activity_user ON checkins(activity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_photos_activity ON photos(activity_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON activity_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_points ON activity_participants(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_likes_photo ON likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity ON comments(activity_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default teams (use INSERT OR IGNORE for SQLite)
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_product', '产品部', '#2563EB');
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_tech', '技术部', '#10B981');
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_design', '设计部', '#8B5CF6');
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_ops', '运营部', '#F59E0B');
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_marketing', '市场部', '#EC4899');
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_hr', '人力资源', '#06B6D4');
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_finance', '财务部', '#6366F1');
INSERT OR IGNORE INTO teams (id, name, color) VALUES ('team_other', '其他', '#6B7280');

-- Default achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_first_step', 'First Step', '完成第一次打卡', '🌟', 'checkin_count', 1, 10);
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_on_fire', 'On Fire', '连续打卡 7 天', '🔥', 'streak', 7, 50);
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_photographer', 'Photographer', '上传 10 张照片', '📸', 'photo_count', 10, 30);
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_popular', 'Popular', '收到 50 个赞', '❤️', 'likes_received', 50, 50);
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_consistent', 'Consistent', '参加 5 个活动', '🎯', 'activities_joined', 5, 100);
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_champion', 'Champion', '在活动排行榜获得第一名', '🏆', 'rank_first', 1, 200);
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_social_butterfly', 'Social Butterfly', '活动参与人数达到 10 人', '👥', 'activity_participants', 10, 50);
INSERT OR IGNORE INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) 
VALUES ('ach_early_bird', 'Early Bird', '早上 8 点前打卡', '🌅', 'early_checkin', 1, 20);
