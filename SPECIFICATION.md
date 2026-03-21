# FICC Connect - Activity Challenge Mini-App Specification

## 1. Project Overview

### 1.1 Product Vision
A fun, engaging WeChat mini-app that encourages employee participation in company activities through gamification, easy check-ins (打卡), photo sharing, and friendly competition.

### 1.2 Core Value Proposition
- **Easy Check-in**: One-tap打卡 with optional photo upload
- **Social Engagement**: Like photos from colleagues
- **Friendly Competition**: Rankings and achievements drive participation
- **Memory Preservation**: Photo galleries for completed activities
- **Team Building**: Discover activities and connect with colleagues

### 1.3 Target Users
- Company employees participating in activities
- Activity organizers creating challenges
- Visitors browsing and supporting participants

### 1.4 Current Implementation Status
- **Backend**: Core APIs implemented (auth, activities, check-ins, photos, likes)
- **Mini-App**: 10 pages implemented with tab-based navigation (WeChat platform)
- **PWA App**: New web-based PWA for cross-platform deployment
- **Features**: WeChat login, activity CRUD, check-in with photos, leaderboards, achievements

---

## 2. Features & Requirements

### 2.1 Core Features

#### User Management
- [x] WeChat auto-login (capture avatar, nickname)
- [x] Team/Department selection during onboarding
- [x] User profile with stats
- [x] Personal achievements display
- [x] Nickname editing

#### Activity Management
- [x] Create new activity (title, description, duration, cover image)
- [x] Browse active and archived activities
- [x] Join/Leave activity
- [x] Auto-archive completed activities (backend)
- [x] Activity detail page with participants and leaderboard

#### Check-in System (打卡)
- [x] One-tap check-in button
- [x] Optional photo upload with check-in
- [x] Daily check-in tracking
- [x] Check-in streak counter
- [x] Today's check-in status on home page
- [ ] Location verification (optional) - NOT IMPLEMENTED
- [ ] Check-in reminders/notifications - NOT IMPLEMENTED

#### Social Features
- [x] Like photos
- [ ] Comment on activity posts - NOT IMPLEMENTED
- [ ] Share activity to WeChat moments - NOT IMPLEMENTED
- [ ] Follow participants - NOT IMPLEMENTED

#### Gamification
- [x] Leaderboard (overall)
- [ ] Leaderboard (daily, weekly) - NOT IMPLEMENTED
- [x] Points system for check-ins and engagement
- [x] Achievement badges (8 default achievements)
- [ ] Team rankings - NOT IMPLEMENTED
- [ ] Winner announcements - NOT IMPLEMENTED

#### Photo Gallery
- [x] Activity photo gallery
- [x] Photo grid view with likes
- [ ] Personal photo collection - NOT IMPLEMENTED
- [ ] Download/share photos - NOT IMPLEMENTED

### 2.2 Navigation Structure

#### Mini-App Navigation
```
┌─────────────────────────────────────────────────────────────┐
│  Tab Bar Navigation                                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   🏠 Home    │  🎯 Activity │  📸 Gallery  │   👤 Profile   │
│              │              │              │                │
│  - My Acts   │  - Discover  │  - Activity  │  - My Stats    │
│  - Archived  │  - Create    │   Galleries  │  - Achievements│
│              │              │              │  - Settings    │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

#### PWA Navigation
```
Mobile (Bottom Tabs):
┌─────────────────────────────────────────┐
│           Content Area                  │
├──────────┬──────────┬──────────┬────────┤
│   🏠     │    🎯    │    📸    │   👤   │
│   Home   │ Activity │  Gallery │ Profile│
└──────────┴──────────┴──────────┴────────┘

Desktop (Top Nav):
┌─────────────────────────────────────────┐
│  Logo    Home  Activity  Gallery  Profile │
├─────────────────────────────────────────┤
│           Content Area                  │
└─────────────────────────────────────────┘
```

**Sub-pages (non-tab):**
- `onboarding` - Login and team selection
- `activity-detail` - Activity details, join/leave, check-in
- `activity-gallery` - Photo gallery for specific activity
- `checkin` - Check-in interface with photo upload
- `create-activity` - Form to create new activity
- `leaderboard` - Activity rankings

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
  - Body: { code, nickname, avatar_url }
  - Response: { success: true, data: { token, user } }

GET /api/auth/profile
  - Auth required
  - Response: { success: true, data: { user, stats, achievements } }

PUT /api/auth/profile
  - Auth required
  - Body: { team_id, nickname }
  - Response: { success: true, data: { user } }

GET /api/auth/teams
  - Response: { success: true, data: { teams } }
```

### 5.2 Activities
```
GET /api/activities
  - Query: { status, page, limit, my_activities }
  - Response: { success: true, data: { activities[], total } }

GET /api/activities/:id
  - Auth optional (attaches is_joined if authenticated)
  - Response: { success: true, data: { activity, participants[], leaderboard[], is_joined } }

POST /api/activities
  - Auth required
  - Body: { title, description, cover_image_url, start_date, end_date, ... }
  - Response: { success: true, data: { activity } }

POST /api/activities/:id/join
  - Auth required
  - Response: { success: true, data: { participant } }

POST /api/activities/:id/leave
  - Auth required
  - Response: { success: true, data: { success } }

GET /api/activities/:id/leaderboard
  - Query: { type, limit }
  - Response: { success: true, data: { rankings[] } }

GET /api/activities/today
  - Auth required
  - Response: { success: true, data: { activities: [{ activity_id, has_checkin, current_streak, ... }] } }
```

### 5.3 Check-ins
```
POST /api/activities/:id/checkin
  - Auth required
  - Body: { photo_url?, comment? }
  - Response: { success: true, data: { checkin, points_earned, streak, achievements[], new_achievements[] } }

GET /api/activities/:id/checkins
  - Query: { date, user_id, page, limit }
  - Response: { success: true, data: { checkins[] } }
```

### 5.4 Photos
```
POST /api/photos/upload
  - Auth required
  - Body: multipart/form-data { photo, activityId, checkinId? }
  - Response: { success: true, data: { photo } }

GET /api/photos/activity/:activityId
  - Auth optional
  - Query: { page, limit, user_id }
  - Response: { success: true, data: { photos[] } }

GET /api/photos/gallery/:activityId
  - Auth optional
  - Response: { success: true, data: { photos[], winners[], stats } }

POST /api/photos/:id/like
  - Auth required
  - Response: { success: true, data: { likes_count, is_liked } }

DELETE /api/photos/:id/like
  - Auth required
  - Response: { success: true, data: { likes_count, is_liked } }
```

### 5.5 Gallery (Merged into Photos API)
Gallery functionality is provided by `GET /api/photos/gallery/:activityId` endpoint.

**Note:** The following endpoints are NOT implemented:
- `GET /api/galleries/archived` - Use `GET /api/activities?status=completed` instead
- `GET /api/users/:id/photos` - Personal photo collection not implemented

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

**Actual Implementation (Orange/Coral Theme):**
```css
/* Primary: Coral/Orange - Energetic and warm */
--primary: #FF6B35;        /* Navigation bar, primary buttons */
--primary-light: #FF8A5B;  /* Hover states */
--primary-dark: #E55A2B;   /* Active states */

/* Accent: Gold/Yellow - Points and achievements */
--accent: #FFD700;         /* Points, streaks, highlights */
--accent-light: #FFE44D;   /* Badges, achievements */

/* Success: Green */
--success: #10B981;        /* Check-in success */
--success-light: #34D399;

/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #FFF8F5;   /* Warm off-white */
--bg-tertiary: #F5F5F5;

/* Text */
--text-primary: #1A1A1A;
--text-secondary: #666666;
--text-muted: #999999;
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
| Mini-App | WeChat Mini-App (WXML/WXSS/JS) |
| PWA App | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Object Storage | Tencent COS / AWS S3 / Alibaba OSS (configurable) |
| Cache | Redis (optional, for leaderboards) - NOT IMPLEMENTED |
| Image Processing | Sharp |
| Authentication | JWT tokens |

### 8.1.1 PWA Tech Stack

| Feature | Technology |
|---------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| PWA Plugin | vite-plugin-pwa |
| Routing | React Router |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| State | React hooks + Context |
| HTTP Client | Fetch API |
| Service Worker | Workbox (auto-generated) |

### 8.2 Storage Configuration
The backend supports multiple cloud storage providers via environment variables:
- `STORAGE_TYPE=coss` - Tencent COS
- `STORAGE_TYPE=s3` - AWS S3
- `STORAGE_TYPE=oss` - Alibaba OSS

### 8.3 Authentication Flows

#### Mini-App (WeChat)
```javascript
// Login flow
wx.login({
  success: (res) => {
    // Send code to backend
    // Backend exchanges for openid/session_key (production)
    // Or generates fake openid (development mode)
    // Returns JWT token
  }
})

// Get user profile (using wx.getUserProfile or getUserInfo)
wx.getUserProfile({
  desc: '用于完善用户资料',
  success: (res) => {
    const { nickName, avatarUrl } = res.userInfo;
    // Send to backend for profile creation
  }
})
```

#### PWA (Web)
```javascript
// Login flow
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token, user } = await response.json();
  localStorage.setItem('token', token);
  return user;
};

// Or use phone/OTP, OAuth providers
```

**Development Mode:** When `NODE_ENV=development`, the backend bypasses WeChat API validation and generates fake openids from the login code. This allows local development without WeChat credentials.

### 8.4 Photo Upload Flow

```
1. User selects/takes photo
   ↓
2. Mini-app compresses image (wx.compressImage)
   ↓
3. Upload to backend via uploadFile
   ↓
4. Backend processes with Sharp
   - Resize if needed
   - Generate thumbnail
   ↓
5. Upload to configured cloud storage (COS/S3/OSS)
   ↓
6. Save metadata to PostgreSQL
   ↓
7. Return photo URL to mini-app
```

**API Client Pattern:**
```javascript
// utils/api.js
const photoAPI = {
  upload: (filePath, activityId, checkinId) =>
    uploadFile('/api/photos/upload', filePath, { activityId, checkinId })
};
```

---

## 9. Development Status

### Implemented (Current)
- [x] User login with WeChat (with dev mode)
- [x] Team selection during onboarding
- [x] Activity CRUD (create, list, join, leave)
- [x] Check-in with optional photo
- [x] Photo upload and gallery
- [x] Like system for photos
- [x] Leaderboard (overall)
- [x] Achievement system (8 default badges)
- [x] Archived activities view
- [x] Today's check-in status
- [x] User profile with stats

### Not Implemented
- [ ] Comments on activities/photos
- [ ] Daily/weekly leaderboard filters
- [ ] Team rankings
- [ ] Push notifications
- [ ] Location verification for check-ins
- [ ] Share to WeChat moments
- [ ] Personal photo collection
- [ ] Photo download/share
- [ ] Analytics dashboard
- [ ] Admin features
- [ ] Redis caching for leaderboards

### Future Enhancements (Original)
- [ ] Live activity streaming
- [ ] Video check-ins
- [ ] AI photo categorization
- [ ] Integration with fitness trackers
- [ ] Company-wide challenges
- [ ] Reward system integration
- [ ] Multi-language support
- [ ] Dark mode

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

**Document Version:** 1.1  
**Last Updated:** 2025-03-21  
**Status:** MVP Implemented - Core Features Complete

---

## Appendix: Project File Structure

### Backend Structure
```
backend/
├── server.js                 # Entry point
├── src/
│   ├── app.js               # Express app setup
│   ├── config/
│   │   ├── database.js      # PostgreSQL pool config
│   │   ├── storage.js       # Storage factory
│   │   ├── storage-cos.js   # Tencent COS implementation
│   │   ├── storage-s3.js    # AWS S3 implementation
│   │   └── storage-oss.js   # Alibaba OSS implementation
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── activityController.js
│   │   └── photoController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── activityService.js
│   │   ├── checkinService.js
│   │   └── photoService.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── activityRoutes.js
│   │   └── photoRoutes.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   ├── errorHandler.js
│   │   └── upload.js        # Multer config
│   ├── repositories/
│   │   └── baseRepository.js
│   └── utils/
│       └── logger.js        # Winston logger
└── migrations/
    ├── 001_initial_schema.sql
    └── run.js
```

### Mini-App Structure
```
miniapp/
├── app.js                   # App lifecycle & global data
├── app.json                 # Page routes & tab config
├── app.wxss                 # Global styles
├── pages/
│   ├── home/               # Home tab - today's activities
│   ├── activity/           # Activity tab - browse & create
│   ├── gallery/            # Gallery tab - activity galleries
│   ├── profile/            # Profile tab - stats & settings
│   ├── onboarding/         # Login & team selection
│   ├── activity-detail/    # Activity details & join
│   ├── activity-gallery/   # Photo gallery for activity
│   ├── checkin/            # Check-in interface
│   ├── create-activity/    # Create activity form
│   └── leaderboard/        # Activity rankings
├── components/
│   ├── activity-card/      # Activity list item
│   ├── avatar/             # User avatar display
│   ├── checkin-btn/        # Check-in button
│   └── photo-grid/         # Photo grid display
├── utils/
│   ├── api.js              # API client methods
│   ├── request.js          # HTTP request wrapper
│   └── util.js             # Helper functions
└── images/                 # Tab icons & assets
```

### PWA Structure
```
pwa/
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── icon-192.png        # App icon (192x192)
│   ├── icon-512.png        # App icon (512x512)
│   └── favicon.ico
├── src/
│   ├── main.jsx            # Entry with PWA registration
│   ├── App.jsx             # Root component with routing
│   ├── components/
│   │   ├── BottomNav.jsx   # Mobile bottom navigation
│   │   ├── TopNav.jsx      # Desktop top navigation
│   │   ├── ActivityCard.jsx
│   │   ├── PhotoGrid.jsx
│   │   ├── Avatar.jsx
│   │   ├── OfflineIndicator.jsx
│   │   └── InstallPrompt.jsx
│   ├── pages/
│   │   ├── Home.jsx        # Today's activities
│   │   ├── Activities.jsx  # Browse & create
│   │   ├── Gallery.jsx     # Photo galleries
│   │   ├── Profile.jsx     # Stats & settings
│   │   ├── Login.jsx       # Login page
│   │   ├── ActivityDetail.jsx
│   │   ├── ActivityGallery.jsx
│   │   ├── Checkin.jsx
│   │   ├── CreateActivity.jsx
│   │   └── Leaderboard.jsx
│   ├── hooks/
│   │   ├── useAuth.js      # Authentication hook
│   │   ├── useMediaQuery.js # Responsive hook
│   │   └── useInstallPrompt.js
│   ├── contexts/
│   │   └── AuthContext.jsx # Global auth state
│   ├── utils/
│   │   ├── api.js          # API client
│   │   └── helpers.js
│   └── styles/
│       └── index.css       # Tailwind imports
├── index.html
├── vite.config.js          # Vite + PWA config
├── tailwind.config.js
├── package.json
└── README.md
```
