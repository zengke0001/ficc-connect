# FICC Connect PWA

Progressive Web App for FICC Connect - a cross-platform alternative to the WeChat Mini-App.

## Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **PWA Capabilities**: Installable, offline support, push notifications ready
- **Shared Backend**: Uses the same API as the WeChat Mini-App
- **Modern Stack**: React 18, Vite, Tailwind CSS

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ActivityCard.jsx
│   ├── BottomNav.jsx      # Mobile navigation
│   ├── TopNav.jsx         # Desktop navigation
│   ├── PhotoGrid.jsx
│   ├── OfflineIndicator.jsx
│   └── InstallPrompt.jsx
├── pages/           # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Home.jsx
│   ├── Activities.jsx
│   ├── Gallery.jsx
│   ├── Profile.jsx
│   ├── ActivityDetail.jsx
│   ├── ActivityGallery.jsx
│   ├── Checkin.jsx
│   ├── CreateActivity.jsx
│   └── Leaderboard.jsx
├── contexts/        # React contexts
│   └── AuthContext.jsx
├── hooks/           # Custom hooks
│   ├── useMediaQuery.js
│   └── useInstallPrompt.js
├── utils/           # Utilities
│   ├── api.js       # API client
│   └── helpers.js   # Helper functions
└── styles/
    └── index.css    # Tailwind + custom styles
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=https://your-api-domain.com
```

For local development, the proxy is configured in `vite.config.js`.

## Authentication

The PWA uses email/password authentication, separate from the WeChat Mini-App:

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

## Navigation

- **Mobile**: Bottom tab navigation (Home, Activities, Gallery, Profile)
- **Desktop**: Top navigation bar with user menu

## PWA Features

### Install Prompt
Users can install the app to their home screen. The `InstallPrompt` component handles this.

### Offline Support
Service worker caches static assets and API responses for offline use.

### Theme Color
Primary color: `#FF6B35` (Coral/Orange)

## Building for Production

```bash
npm run build
```

The `dist` folder will contain the production build with:
- Optimized assets
- Service worker
- Manifest.json

## Deployment

### Static Hosting (Netlify, Vercel, etc.)

1. Build the project: `npm run build`
2. Deploy the `dist` folder

### Docker

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Differences from Mini-App

| Feature | Mini-App | PWA |
|---------|----------|-----|
| Platform | WeChat | Web (any browser) |
| Login | WeChat OAuth | Email/Password |
| Navigation | Tab bar | Responsive (tabs/desktop) |
| Storage | WeChat storage | localStorage |
| Share | WeChat share | Web Share API |

## Development Notes

- The PWA uses the same backend API as the Mini-App
- JWT tokens are stored in localStorage
- Images are uploaded to the same cloud storage (COS/S3/OSS)
- Responsive breakpoints: mobile (< 768px), desktop (>= 768px)
