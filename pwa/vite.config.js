import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ficc-connect/',
  build: {
    // Output to backend/public so the backend can serve PWA files
    outDir: '../backend/public',
    emptyOutDir: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FICC Connect',
        short_name: 'FICC',
        description: 'Company activity management with gamification',
        theme_color: '#FF6B35',
        background_color: '#FFF8F5',
        display: 'standalone',
        scope: '/ficc-connect/',
        start_url: '/ficc-connect/',
        icons: [
          { src: '/ficc-connect/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/ficc-connect/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/ficc-connect/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/ficc-connect/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\//,
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
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
