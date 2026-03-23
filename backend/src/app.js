require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for PWA compatibility
}));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Trust proxy (needed for correct IP behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting - skip successful requests to avoid counting them
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip health checks
    if (req.path === '/health') return true;
    return false;
  },
  // Use a custom key generator that respects X-Forwarded-For
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Serve static files from public directory (PWA build)
const publicPath = path.join(__dirname, '../public');

// Redirect /ficc-connect to /ficc-connect/
app.get('/ficc-connect', (req, res) => {
  res.redirect('/ficc-connect/');
});

// Static files at /ficc-connect - must come before SPA fallback
app.use('/ficc-connect', express.static(publicPath, {
  index: 'index.html', // Serve index.html for directory requests
  extensions: ['html'], // Try adding .html extension
  setHeaders: (res, path) => {
    // Set correct MIME type for webmanifest
    if (path.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
    // Set correct MIME type for service worker
    if (path.endsWith('sw.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      // Ensure service worker is not cached
      res.setHeader('Cache-Control', 'no-cache');
    }
    // Add COOP/COEP headers for PWA
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    }
  }
}));

// SPA fallback for /ficc-connect routes (handle client-side routing)
// This only runs if express.static didn't find a matching file
app.use('/ficc-connect', (req, res, next) => {
  // Only handle GET requests for HTML (SPA routes)
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    next();
  }
});

// Redirect root to PWA
app.get('/', (req, res) => {
  res.redirect('/ficc-connect/');
});

// Error handling
app.use(errorHandler);

module.exports = app;
