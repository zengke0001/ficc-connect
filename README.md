# FICC Connect

A WeChat Mini-App for company activity management with gamification features.

## Features

- **Activity Management**: Create and join various company activities
- **Daily Check-in (打卡)**: Easy one-tap check-in with photo upload support
- **Gamification System**: 
  - Points for check-ins, streaks, and achievements
  - Achievement badges and rewards
  - Real-time leaderboards (daily, weekly, overall)
- **Photo Gallery**: Share moments from activities with likes and comments
- **Team Integration**: Organized by departments/teams with color coding
- **WeChat Integration**: Seamless login with WeChat profile

## Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT tokens
- **File Upload**: Multer + Sharp for image processing
- **Storage**: Tencent COS / AWS S3 / Alibaba OSS (configurable)
- **Logging**: Winston logger
- **Development**: Nodemon for hot-reload

### Frontend
- **Platform**: WeChat Mini-App
- **Styling**: WXSS with CSS variables
- **State Management**: getApp() global state
- **Navigation**: Tab-based navigation (4 tabs)

## Project Structure

```
ficc-connect/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/         # Database & storage config
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, error handling, upload
│   │   ├── routes/         # API routes
│   │   └── utils/          # Logger, helpers
│   ├── migrations/         # Database migrations
│   ├── .env.example        # Environment variables template
│   └── server.js           # Entry point
├── miniapp/                # WeChat Mini-App frontend
│   ├── pages/             # App pages (9 total)
│   │   ├── onboarding/    # Login & team selection
│   │   ├── home/          # Activity feed
│   │   ├── activity/      # All activities list
│   │   ├── activity-detail/ # Activity details & check-in
│   │   ├── checkin/       # Check-in interface
│   │   ├── create-activity/ # Create new activity
│   │   ├── leaderboard/   # Rankings
│   │   ├── gallery/       # Photo gallery
│   │   └── profile/       # User profile & stats
│   ├── components/        # Reusable components
│   ├── utils/            # request.js, uploadFile.js
│   ├── images/           # Tab icons & assets
│   ├── app.json          # App configuration
│   └── project.config.json # DevTools config
└── README.md
```

## Quick Start

### Prerequisites
- Node.js >= 18.x
- PostgreSQL >= 12.x
- WeChat Developer Tools (for frontend)

### Backend Setup

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials and storage config
```

3. **Create database**
```bash
# The migration will run automatically on first start
# Or manually: node migrations/run-migrations.js
```

4. **Start development server**
```bash
npm run dev
# Server runs on http://localhost:3001
```

### Frontend Setup

1. **Open in WeChat Developer Tools**
   - Launch WeChat Developer Tools
   - Import project from `miniapp/` directory
   - Use AppID: `wx741140a86c56013c` (or your own)

2. **Configure for development**
   - Enable "不校验合法域名" in DevTools settings
   - Disable "urlCheck" in `project.config.json`

3. **Compile and preview**
   - Click compile button
   - Test on simulator or real device

## API Endpoints

### Authentication
- `POST /api/auth/wechat` - WeChat login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/teams` - Get all teams

### Activities
- `GET /api/activities` - List activities (paginated)
- `POST /api/activities` - Create activity
- `GET /api/activities/:id` - Get activity details
- `POST /api/activities/:id/join` - Join activity
- `POST /api/activities/:id/leave` - Leave activity
- `GET /api/activities/:id/leaderboard` - Get activity leaderboard
- `POST /api/activities/:id/checkin` - Check-in to activity
- `GET /api/activities/:id/checkins` - Get activity check-ins

### Photos
- `POST /api/photos/upload` - Upload photo
- `GET /api/photos/activity/:activityId` - Get activity photos
- `GET /api/photos/gallery/:activityId` - Get gallery view
- `POST /api/photos/:id/like` - Like a photo

## Configuration

### Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ficc_connect
DB_USER=postgres
DB_PASSWORD=your-password

# WeChat (production)
WECHAT_APP_ID=your-app-id
WECHAT_APP_SECRET=your-app-secret

# Storage (Tencent COS example)
STORAGE_TYPE=cos
COS_BUCKET=test-1250000000
COS_REGION=ap-guangzhou
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key
```

### Development Mode

The backend supports development mode for local testing without WeChat credentials:
- Set `NODE_ENV=development`
- Uses fake openid generated from login code
- Bypasses WeChat API validation
- Perfect for local development and testing

## Database Schema

**Tables:**
- `users` - User accounts with WeChat integration
- `teams` - Department/team organization
- `activities` - Activity definitions
- `activity_participants` - Activity memberships
- `checkins` - Daily check-in records
- `photos` - Uploaded photos
- `likes` - Photo likes
- `comments` - Photo comments
- `achievements` - Achievement badge definitions
- `user_achievements` - User earned achievements

## Gamification System

### Points
- Create activity: +20 points
- Join activity: +5 points
- Daily check-in: +10 points
- Upload photo: +5 points per photo
- Streak bonus: +2 points per consecutive day

### Achievements
- 🏆 **First Step**: Complete first check-in
- 🔥 **Week Warrior**: 7-day streak
- 💪 **Month Master**: 30-day streak
- ⭐ **Activity Star**: Top of leaderboard

## Testing

Run basic API tests:
```bash
# Health check
curl http://localhost:3001/health

# Get teams
curl http://localhost:3001/api/auth/teams

# Get activities
curl http://localhost:3001/api/activities
```

## Troubleshooting

### Backend Issues
- **Database connection error**: Check .env credentials and PostgreSQL is running
- **Port already in use**: Kill process on port 3001 or change PORT in .env
- **SASL authentication error**: Ensure dotenv loads before database pool init

### Frontend Issues
- **App crashes on startup**: Check request.js doesn't call getApp() at module scope
- **Network requests blocked**: Disable "urlCheck" in project.config.json
- **Login fails**: Enable "不校验合法域名" in DevTools settings
- **Image not found errors**: Ensure all icon files exist in /images/

## License

MIT

## Support

For issues and questions, please use the "/feedback" command or visit https://forum.qoder.com/

---

🤖 Generated with [Qoder](https://qoder.com)
