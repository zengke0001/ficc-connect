# FICC Connect - Activity Challenge Mini-App Specification

## 1. Project Overview

### 1.1 Product Vision
A fun, engaging WeChat mini-app that encourages employee participation in company activities through gamification, easy check-ins (打卡), photo sharing, and friendly competition.

### 1.2 Core Value Proposition
- **Easy Check-in**: One-tap打卡 with optional photo upload
- **Social Engagement**: Like, share, and cheer for colleagues
- **Friendly Competition**: Rankings and achievements drive participation
- **Memory Preservation**: Photo galleries for completed activities
- **Team Building**: Discover activities and connect with colleagues

### 1.3 Target Users
- Company employees participating in activities
- Activity organizers creating challenges
- Visitors browsing and supporting participants

---

## 2. Features & Requirements

### 2.1 Core Features

#### User Management
- [ ] WeChat auto-login (capture avatar, nickname)
- [ ] Team/Department selection during onboarding
- [ ] User profile with activity history
- [ ] Personal stats and achievements

#### Activity Management
- [ ] Create new activity (title, description, duration, rules)
- [ ] Browse active activities
- [ ] Join/Leave activity
- [ ] Archive completed activities
- [ ] Activity detail page with participants

#### Check-in System (打卡)
- [ ] One-tap check-in button
- [ ] Optional photo upload with check-in
- [ ] Daily check-in tracking
- [ ] Check-in streak counter
- [ ] Location verification (optional)
- [ ] Check-in reminders/notifications

#### Social Features
- [ ] Like photos and check-ins
- [ ] Comment on activity posts
- [ ] Share activity to WeChat moments
- [ ] Follow participants

#### Gamification
- [ ] Leaderboard (daily, weekly, overall)
- [ ] Points system for check-ins and engagement
- [ ] Achievement badges
- [ ] Team rankings
- [ ] Winner announcements

#### Photo Gallery
- [ ] Activity photo gallery
- [ ] Personal photo collection
- [ ] Photo grid view with likes
- [ ] Download/share photos

### 2.2 Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Tab Bar Navigation                                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   🏠 Home    │  🎯 Activity │  📸 Gallery  │   👤 Profile   │
│              │              │              │                │
│  - My Acts   │  - Discover  │  - My Photos │  - My Stats    │
│  - Archived  │  - Create    │  - Activity  │  - Settings    │
│              │              │   Galleries  │  - Teams       │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## 3. User Flows

### 3.1 First-Time User Onboarding

```
1. Open Mini-App
   ↓
2. WeChat Login (auto)
   - Capture: avatar, nickname, openid
   ↓
3. Profile Setup
   - Select Team/Department
   - Confirm nickname
   ↓
4. Welcome Tutorial (swipeable)
   - How to join activities
   - How to check-in
   - How to earn points
   ↓
5. Home Screen
```

### 3.2 Activity Participation Flow

```
1. Browse Activities (Home/Activity Tab)
   ↓
2. View Activity Detail
   - Description, rules, duration
   - Current participants
   - Leaderboard preview
   ↓
3. Join Activity
   ↓
4. Daily Check-in
   - Tap "打卡" button
   - Optional: Take/Upload photo
   - Add comment (optional)
   ↓
5. View Progress
   - Personal ranking
   - Streak count
   - Points earned
```

### 3.3 Create Activity Flow

```
1. Activity Tab → Create Button
   ↓
2. Fill Activity Form
   - Title (required)
   - Description (required)
   - Cover image
   - Start/End date
   - Check-in rules
   - Points configuration
   ↓
3. Preview & Publish
   ↓
4. Share to invite participants
```

---

## 4. Database Schema

### 4.1 Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    openid VARCHAR(100) UNIQUE NOT NULL,  -- WeChat openid
    nickname VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    team_id UUID REFERENCES teams(id),
    total_points INTEGER DEFAULT 0,
    checkin_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams/Departments
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#2563EB',  -- For UI theming
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',  -- active, completed, archived
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    checkin_start_time TIME DEFAULT '06:00',
    checkin_end_time TIME DEFAULT '23:59',
    points_per_checkin INTEGER DEFAULT 10,
    points_per_photo INTEGER DEFAULT 5,
    allow_late_checkin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Participants
CREATE TABLE activity_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_checkins INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    UNIQUE(activity_id, user_id)
);

-- Check-ins (打卡)
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    photo_url VARCHAR(500),
    comment TEXT,
    points_earned INTEGER DEFAULT 0,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    UNIQUE(activity_id, user_id, checkin_date)
);

-- Photos
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id UUID REFERENCES checkins(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    storage_key VARCHAR(500) NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    width INTEGER,
    height INTEGER,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_id)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements/Badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    condition_type VARCHAR(50),  -- checkin_count, streak, points, etc.
    condition_value INTEGER,
    points_reward INTEGER DEFAULT 0
);

-- User Achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_dates ON activities(start_date, end_date);
CREATE INDEX idx_checkins_activity_user ON checkins(activity_id, user_id);
CREATE INDEX idx_checkins_date ON checkins(checkin_date);
CREATE INDEX idx_photos_activity ON photos(activity_id);
CREATE INDEX idx_photos_user ON photos(user_id);
CREATE INDEX idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX idx_activity_participants_points ON activity_participants(total_points DESC);
```

---

## 5. API Endpoints

### 5.1 Authentication
```
POST /api/auth/wechat
  - Body: { code }  // WeChat login code
  - Response: { token, user }

GET /api/auth/profile
  - Auth required
  - Response: { user, stats, achievements }

PUT /api/auth/profile
  - Auth required
  - Body: { team_id, nickname }
  - Response: { user }
```

### 5.2 Activities
```
GET /api/activities
  - Query: { status, page, limit, my_activities }
  - Response: { activities[], total }

GET /api/activities/:id
  - Auth optional
  - Response: { activity, participants[], leaderboard[], is_joined }

POST /api/activities
  - Auth required
  - Body: { title, description, cover_image, start_date, end_date, rules }
  - Response: { activity }

POST /api/activities/:id/join
  - Auth required
  - Response: { participant }

POST /api/activities/:id/leave
  - Auth required
  - Response: { success }

GET /api/activities/:id/leaderboard
  - Query: { type: 'daily' | 'weekly' | 'overall' }
  - Response: { rankings[] }
```

### 5.3 Check-ins
```
POST /api/activities/:id/checkin
  - Auth required
  - Body: { photo?, comment?, location? }
  - Response: { checkin, points_earned, streak, achievements[] }

GET /api/activities/:id/checkins
  - Query: { date, user_id, page, limit }
  - Response: { checkins[] }

GET /api/checkins/today
  - Auth required
  - Response: { activities: [{ activity_id, has_checkin }] }
```

### 5.4 Photos
```
POST /api/photos/upload
  - Auth required
  - Body: multipart/form-data { file, activity_id, checkin_id? }
  - Response: { photo, url }

GET /api/activities/:id/photos
  - Query: { page, limit, user_id }
  - Response: { photos[] }

GET /api/users/:id/photos
  - Query: { page, limit }
  - Response: { photos[] }

POST /api/photos/:id/like
  - Auth required
  - Response: { likes_count }

DELETE /api/photos/:id/like
  - Auth required
  - Response: { likes_count }
```

### 5.5 Gallery
```
GET /api/galleries/activities/:id
  - Query: { page, limit }
  - Response: { photos[], winners[], stats }

GET /api/galleries/archived
  - Query: { page, limit, year, month }
  - Response: { activities[] }
```

---

## 6. UI/UX Design Guidelines

### 6.1 Design Principles

**Fun & Engaging:**
- Playful animations for check-ins (confetti, badges popping)
- Bright, energetic color scheme
- Gamification elements (streak flames, achievement unlocks)

**Simple & Easy:**
- One-tap check-in from home screen
- Clear visual hierarchy
- Minimal steps for common actions
- Large touch targets (min 88rpx)

**Social & Connected:**
- Avatar displays everywhere
- Like animations with hearts
- Real-time leaderboard updates

### 6.2 Color Palette

```css
/* Primary: Ocean Breeze - Professional yet energetic */
--primary: #2563EB;        /* Main actions, buttons */
--primary-light: #60A5FA;  /* Hover states */
--primary-dark: #1D4ED8;   /* Active states */

/* Accent: Sunset - Fun elements */
--accent: #F59E0B;         /* Points, streaks, highlights */
--accent-light: #FBBF24;   /* Badges, achievements */

/* Success: Green */
--success: #10B981;        /* Check-in success */
--success-light: #34D399;

/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F8FAFC;
--bg-tertiary: #F1F5F9;

/* Text */
--text-primary: #1E293B;
--text-secondary: #64748B;
--text-muted: #94A3B8;
```

### 6.3 Key Screens

#### Home Screen
```
┌─────────────────────────────┐
│  👤 Avatar  FICC Connect    │
│  "Keep the streak alive!"   │
├─────────────────────────────┤
│  🔥 Current Streak: 5 days  │
├─────────────────────────────┤
│  My Active Activities       │
│  ┌─────────────────────┐   │
│  │ 🏃 Morning Run      │   │
│  │ [打卡] 今日已打卡 ✓ │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 🧘 Yoga Challenge   │   │
│  │ [打卡] 还未打卡     │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  📊 Quick Stats             │
│  本月打卡: 23  排名: #3     │
├─────────────────────────────┤
│  [+] 发现新活动             │
└─────────────────────────────┘
```

#### Check-in Screen
```
┌─────────────────────────────┐
│  ← Morning Run Challenge    │
├─────────────────────────────┤
│                             │
│     ┌─────────────┐         │
│     │             │         │
│     │   📷        │  Tap to │
│     │   Tap to    │  add    │
│     │   add photo │  photo  │
│     │             │         │
│     └─────────────┘         │
│                             │
│  ┌─────────────────────┐   │
│  │ 今天感觉怎么样？    │   │
│  │ (optional comment)  │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │    🔥 立即打卡      │   │
│  └─────────────────────┘   │
│                             │
│  Current streak: 5 days 🔥  │
└─────────────────────────────┘
```

#### Activity Detail
```
┌─────────────────────────────┐
│  ← Activity Title           │
├─────────────────────────────┤
│  [Cover Image]              │
│  ┌─────────────────────┐   │
│  │ Description...      │   │
│  │ 时间: 2025.01.01-31 │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  🏆 Leaderboard             │
│  1. 👤 Alice      150pts   │
│  2. 👤 Bob        128pts   │
│  3. 👤 You        120pts   │
├─────────────────────────────┤
│  📸 Recent Photos           │
│  [Grid of photos]          │
├─────────────────────────────┤
│  [  加入活动  ]  or  [打卡] │
└─────────────────────────────┘
```

#### Leaderboard
```
┌─────────────────────────────┐
│  ← Leaderboard              │
│  [今日] [本周] [总榜]       │
├─────────────────────────────┤
│  🥇  🥈  🥉                │
│  Alice Bob  Carol           │
│  150   128   120            │
├─────────────────────────────┤
│  4.  David      115pts     │
│  5.  Eve        110pts     │
│  ...                        │
│  12. You        85pts  ⬆️   │
├─────────────────────────────┤
│  Team Rankings              │
│  🥇 产品部  平均 120pts     │
│  🥈 技术部  平均 115pts     │
└─────────────────────────────┘
```

---

## 7. Gamification System

### 7.1 Points System

| Action | Points | Notes |
|--------|--------|-------|
| Daily check-in | 10 | Base points |
| Check-in with photo | +5 | Bonus for photo |
| 3-day streak | +10 | Streak bonus |
| 7-day streak | +25 | Weekly streak |
| 30-day streak | +100 | Monthly streak |
| Receive a like | +1 | Per like on photo |
| Join activity | +5 | One-time |
| Create activity | +20 | One-time |

### 7.2 Achievement Badges

| Badge | Condition | Icon |
|-------|-----------|------|
| 🌟 First Step | First check-in | Star |
| 🔥 On Fire | 7-day streak | Flame |
| 📸 Photographer | Upload 10 photos | Camera |
| ❤️ Popular | Receive 50 likes | Heart |
| 🎯 Consistent | Join 5 activities | Target |
| 🏆 Champion | Rank #1 in activity | Trophy |
| 👥 Social Butterfly | 10 activity participants | People |
| 🌅 Early Bird | Check-in before 8am | Sun |

### 7.3 Leaderboard Types

- **Daily**: Reset every day, encourages daily participation
- **Weekly**: Sunday-Saturday, shows consistent effort
- **Overall**: All-time rankings for the activity
- **Team**: Average points by department/team

---

## 8. Technical Architecture

### 8.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | WeChat Mini-App (WXML/WXSS/JS) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Object Storage | Tencent COS (recommended) |
| Cache | Redis (optional, for leaderboards) |
| Image Processing | Sharp |

### 8.2 WeChat Integration

```javascript
// Login flow
wx.login({
  success: (res) => {
    // Send code to backend
    // Backend exchanges for openid/session_key
    // Returns JWT token
  }
})

// Get user profile
wx.getUserProfile({
  desc: '用于完善用户资料',
  success: (res) => {
    const { nickName, avatarUrl } = res.userInfo;
    // Send to backend for profile creation
  }
})
```

### 8.3 Photo Upload Flow

```
1. User selects/takes photo
   ↓
2. Mini-app compresses image (wx.compressImage)
   ↓
3. Upload to backend
   ↓
4. Backend processes with Sharp
   - Resize if needed
   - Generate thumbnail
   ↓
5. Upload to Tencent COS
   ↓
6. Save metadata to PostgreSQL
   ↓
7. Return photo URL to mini-app
```

---

## 9. Development Phases

### Phase 1: MVP (Week 1-2)
- [ ] User login with WeChat
- [ ] Basic activity CRUD
- [ ] Simple check-in (no photo)
- [ ] Basic leaderboard

### Phase 2: Core Features (Week 3-4)
- [ ] Photo upload
- [ ] Like system
- [ ] Achievements
- [ ] Team management

### Phase 3: Polish (Week 5-6)
- [ ] Photo galleries
- [ ] Archived activities
- [ ] Animations & micro-interactions
- [ ] Performance optimization

### Phase 4: Advanced (Week 7-8)
- [ ] Comments
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Admin features

---

## 10. Success Metrics

### Engagement
- Daily Active Users (DAU)
- Average check-ins per user per week
- Photo upload rate
- Activity participation rate

### Retention
- Day 1 / Day 7 / Day 30 retention
- Streak maintenance rate
- Return visit frequency

### Social
- Likes given/received per user
- Comments per activity
- Shares to WeChat moments

### Performance
- Check-in completion time (< 10 seconds)
- Photo upload success rate (> 95%)
- App load time (< 3 seconds)

---

## 11. Future Enhancements

- [ ] Live activity streaming
- [ ] Video check-ins
- [ ] AI photo categorization
- [ ] Integration with fitness trackers
- [ ] Company-wide challenges
- [ ] Reward system integration
- [ ] Multi-language support
- [ ] Dark mode

---

**Document Version:** 1.0  
**Last Updated:** 2025-03-19  
**Status:** Ready for Development
