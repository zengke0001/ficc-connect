---
name: pwa-dev
description: Build Progressive Web Apps (PWA) with React, Vite, and modern PWA features. Use when creating PWA projects, implementing service workers, adding offline support, or building web apps that work like native apps.
---

# PWA Development

## Quick Start

Create a new PWA project with Vite + React:

```bash
npm create vite@latest pwa -- --template react
cd pwa
npm install
npm install -D vite-plugin-pwa workbox-window
```

## PWA Configuration (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'App Name',
        short_name: 'App',
        description: 'App description',
        theme_color: '#FF6B35',
        background_color: '#FFF8F5',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 2592000 }
            }
          }
        ]
      }
    })
  ]
})
```

## Project Structure

```
pwa/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── icon-192.png
│   ├── icon-512.png
│   └── sw.js             # Custom service worker (optional)
├── src/
│   ├── main.jsx          # Entry with PWA registration
│   ├── App.jsx           # Root component
│   ├── components/       # Reusable components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom hooks
│   ├── stores/           # State management
│   ├── utils/            # Utilities
│   └── styles/           # CSS/styling
├── index.html
├── vite.config.js
└── package.json
```

## PWA Registration (main.jsx)

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { registerSW } from 'virtual:pwa-register'

// Register service worker
registerSW({
  onNeedRefresh() {
    if (confirm('New version available. Reload?')) {
      location.reload()
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

## Navigation Patterns

### Bottom Tab Navigation (Mobile-First)

```jsx
// components/BottomNav.jsx
import { Home, Activity, Image, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()
  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/activities', icon: Activity, label: 'Activities' },
    { path: '/gallery', icon: Image, label: 'Gallery' },
    { path: '/profile', icon: User, label: 'Profile' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      {tabs.map(({ path, icon: Icon, label }) => (
        <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>
          <Icon size={24} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
```

### Top Navigation (Desktop)

```jsx
// components/TopNav.jsx
export function TopNav() {
  return (
    <header className="sticky top-0 bg-white shadow">
      <nav className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold">Logo</Link>
        <div className="flex gap-4">
          <Link to="/">Home</Link>
          <Link to="/activities">Activities</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/profile">Profile</Link>
        </div>
      </nav>
    </header>
  )
}
```

## Responsive Layout Pattern

```jsx
// App.jsx
import { Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { TopNav } from './components/TopNav'
import { useMediaQuery } from './hooks/useMediaQuery'

function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <div className="min-h-screen bg-gray-50">
      {isDesktop && <TopNav />}
      <main className={`${isDesktop ? 'pt-16' : 'pb-16'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {!isDesktop && <BottomNav />}
    </div>
  )
}
```

## API Client with Auth

```javascript
// utils/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class API {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }

  get(endpoint) { return this.request(endpoint) }
  post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }) }
  put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }) }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }) }
}

export const api = new API()
```

## Styling with Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        'primary-light': '#FF8A5B',
        'primary-dark': '#E55A2B',
        accent: '#FFD700',
        success: '#10B981',
        background: '#FFF8F5'
      }
    }
  },
  plugins: []
}
```

## Common PWA Features

### Install Prompt

```jsx
// hooks/useInstallPrompt.js
import { useState, useEffect } from 'react'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setIsInstallable(false)
    return outcome
  }

  return { isInstallable, install }
}
```

### Offline Indicator

```jsx
// components/OfflineIndicator.jsx
import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
      <WifiOff className="inline mr-2" size={16} />
      You are offline
    </div>
  )
}
```

## Build and Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy (example: Netlify)
npx netlify deploy --prod --dir=dist
```

## Testing PWA

1. **Lighthouse**: Run in Chrome DevTools > Lighthouse > PWA
2. **DevTools**: Application tab > Manifest, Service Workers
3. **Mobile**: Use Chrome Remote Debugging
