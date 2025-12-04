// server/index.js - Simplified Main Entry Point
// All routes have been extracted to modular files in server/routes/
require("dotenv").config();

// Initialize Sentry FIRST (before any other code)
const { initSentry } = require('./config/sentry');
const { logger, logRequest } = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

// Import usage configuration
const { FREE_QUOTA } = require("./config/usage.js");

// Initialize Stripe after dotenv loads
const Stripe = require("stripe");
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Initialize Supabase clients
const { createClient } = require('@supabase/supabase-js');
// Service role client for admin operations (database writes, etc.)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
// Auth client for JWT verification (uses anon key or service role key as fallback)
const supabaseAuth = process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Initialize Odds Cache Service
const oddsCacheService = require('./services/oddsCache');
if (supabase) {
  oddsCacheService.initialize(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const app = express();

// Initialize Sentry error tracking
initSentry(app);

// Store services in app.locals for route access
app.locals.stripe = stripe;
app.locals.supabase = supabase;
app.locals.supabaseAuth = supabaseAuth; // For JWT verification
app.locals.oddsCacheService = oddsCacheService;
app.locals.userUsage = new Map(); // In-memory usage tracking

// Middleware setup
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://oddsightseer.com',
      'https://www.oddsightseer.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow Render frontend deployments and local preview ports
    if (!origin || allowedOrigins.includes(origin) || origin.includes('.onrender.com') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-cache-buster', 'x-requested-with', 'Cache-Control', 'Pragma', 'Expires'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ============================================================================
// STRIPE WEBHOOK - MUST be before express.json() to access raw body stream
// Only the webhook endpoint needs raw body for signature verification
// ============================================================================
const bodyParser = require('body-parser');
const billingRoutes = require('./routes/billing');
// Register ONLY the webhook with raw body parser (before express.json)
app.post('/api/billing/webhook', bodyParser.raw({ type: 'application/json' }), (req, res, next) => {
  // Forward to billing routes
  req.url = '/webhook';
  billingRoutes(req, res, next);
});

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(logRequest);

// Authentication middleware - MUST be before routes
// This extracts the JWT token from Authorization header and populates req.user
const { authenticate } = require('./middleware/auth');
app.use(authenticate);

// Register billing routes (except webhook) AFTER authentication
app.use('/api/billing', billingRoutes);

// Static file serving
const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Serve service worker from public
app.use(express.static(path.join(__dirname, '../client/public')));

// ============================================================================
// ROUTE REGISTRATION - All routes imported from modular files
// ============================================================================

// Import route modules
const { registerRoutes } = require('./routes');
const { ENABLE_PLAYER_PROPS_V2 } = require('./config/constants');

// Log feature flags at startup
console.log('🚀 Feature Flags:', {
  ENABLE_PLAYER_PROPS_V2,
  NODE_ENV: process.env.NODE_ENV,
});

// Health check endpoint (before route registration)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: 'e5f7a3b', // Update this on each deploy
    node: process.version
  });
});

// Register all routes
registerRoutes(app);

// ============================================================================
// GAME REACTIONS ENDPOINT - Kept in main file (simple, non-critical)
// ============================================================================

const REACTIONS_FILE = path.join(__dirname, 'reactions.json');

// Load reactions from file on startup
let gameReactions = new Map();
try {
  if (fs.existsSync(REACTIONS_FILE)) {
    const data = fs.readFileSync(REACTIONS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    gameReactions = new Map(Object.entries(parsed));
    console.log(`📝 Loaded ${gameReactions.size} game reactions from file`);
  }
} catch (error) {
  console.warn('⚠️ Failed to load reactions from file:', error.message);
  gameReactions = new Map();
}

// Save reactions to file
function saveReactions() {
  try {
    const data = Object.fromEntries(gameReactions);
    fs.writeFileSync(REACTIONS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Failed to save reactions to file:', error.message);
  }
}

// Get reactions for a specific game
app.get('/api/reactions/:gameKey', (req, res) => {
  try {
    const { gameKey } = req.params;
    const reactions = gameReactions.get(gameKey) || {};
    res.json(reactions);
  } catch (err) {
    console.error('Get reactions error:', err);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

// Add reaction to a game
app.post('/api/reactions/:gameKey/:emoji', (req, res) => {
  try {
    const { gameKey, emoji } = req.params;
    const { userId } = req.body;

    if (!gameKey || !emoji || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!gameReactions.has(gameKey)) {
      gameReactions.set(gameKey, {});
    }

    const reactions = gameReactions.get(gameKey);
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
      saveReactions();
    }

    res.json({ success: true, reactions });
  } catch (err) {
    console.error('Add reaction error:', err);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from a game
app.delete('/api/reactions/:gameKey/:emoji', (req, res) => {
  try {
    const { gameKey, emoji } = req.params;
    const { userId } = req.body;

    if (!gameKey || !emoji || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (gameReactions.has(gameKey)) {
      const reactions = gameReactions.get(gameKey);
      if (reactions[emoji]) {
        reactions[emoji] = reactions[emoji].filter(id => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
        saveReactions();
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Remove reaction error:', err);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Get reactions summary for multiple games
app.post('/api/reactions/summary', (req, res) => {
  try {
    const { gameKeys } = req.body;

    if (!Array.isArray(gameKeys)) {
      return res.status(400).json({ error: 'gameKeys must be an array' });
    }

    const summary = {};
    gameKeys.forEach(gameKey => {
      if (gameReactions.has(gameKey)) {
        const reactions = gameReactions.get(gameKey);
        let totalReactions = 0;
        Object.keys(reactions).forEach(emoji => {
          totalReactions += reactions[emoji].length;
        });

        summary[gameKey] = {
          totalReactions,
          reactions: Object.keys(reactions).reduce((acc, emoji) => {
            acc[emoji] = reactions[emoji].length;
            return acc;
          }, {})
        };
      }
    });
    res.json({ summary });
  } catch (err) {
    console.error('Get reactions summary error:', err);
    res.status(500).json({ error: 'Failed to get reactions summary' });
  }
});

// ============================================================================
// ERROR HANDLING & SERVER STARTUP
// ============================================================================

// 404 handler - before SPA fallback
app.use(notFoundHandler);

// Error handling middleware - MUST be last
app.use(errorHandler);

// SPA fallback: keep last, after static and API routes
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

// Start server
const PORT = process.env.PORT || 10000;

if (require.main === module) {
  app.listen(PORT, async () => {
    logger.info(`✅ Server running on http://localhost:${PORT}`, {
      environment: process.env.NODE_ENV,
      port: PORT,
    });
    
    // Auto-start NFL odds caching if enabled
    if (process.env.AUTO_START_NFL_CACHE === 'true' && supabase) {
      logger.info('🏈 Auto-starting NFL odds caching...');
      try {
        await oddsCacheService.startNFLUpdates();
      } catch (error) {
        logger.error('❌ Failed to auto-start NFL caching:', {
          error: error.message,
        });
      }
    }
  });
}

module.exports = app;
