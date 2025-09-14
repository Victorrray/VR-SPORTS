// server/index.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

// Import usage configuration
const { FREE_QUOTA } = require("./config/usage.js");

// Initialize Stripe after dotenv loads
const Stripe = require("stripe");
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Initialize Supabase client for server operations
const { createClient } = require('@supabase/supabase-js');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ODDS_API_KEY;
const SPORTSGAMEODDS_API_KEY = process.env.SPORTSGAMEODDS_API_KEY || null;


// Stripe configuration
const STRIPE_PRICE_PLATINUM = process.env.STRIPE_PRICE_PLATINUM;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// In-memory storage for usage tracking (replace with Supabase in production)
const userUsage = new Map(); // user_id -> { period_start, period_end, calls_made }
// userPlans removed - now using Supabase exclusively for plan management

// Constants for improved player props stability and COST REDUCTION
const FOCUSED_BOOKMAKERS = [
  // US region books
  "draftkings", "fanduel", "betmgm", "caesars", "pointsbet", "bovada", 
  "mybookie", "betonline", "unibet", "betrivers", "novig", "fliff",
  // UK region books
  "bet365", "williamhill", "ladbrokes", "coral", "paddypower", "skybet",
  // US exchange books
  "prophet_exchange",
  // International (for comparison)
  "pinnacle"
];

// Trial user bookmaker restrictions (expanded to 8 major books for better experience)
const TRIAL_BOOKMAKERS = ["draftkings", "fanduel", "caesars", "betmgm", "pointsbet", "betrivers", "unibet", "bovada"];

// Player props completely removed

const MAX_BOOKMAKERS = 16; // Increased to accommodate all US, US2, and exchange books
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache
// Player props functionality removed

// In-memory cache for API responses
const apiCache = new Map();

function getCacheKey(endpoint, params) {
  return `${endpoint}_${JSON.stringify(params)}`;
}

function getCachedResponse(cacheKey) {
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`📦 Cache HIT for ${cacheKey}`);
    return cached.data;
  }
  if (cached) {
    apiCache.delete(cacheKey); // Remove expired cache
  }
  return null;
}

function setCachedResponse(cacheKey, data) {
  apiCache.set(cacheKey, { data, timestamp: Date.now() });
  console.log(`💾 Cached response for ${cacheKey}`);
}

// Helper function to get current monthly window (UTC)
function currentMonthlyWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

// Helper function to clamp bookmaker lists
function clampBookmakers(bookmakers = []) {
  if (!bookmakers || bookmakers.length === 0) {
    return FOCUSED_BOOKMAKERS;
  }
  
  // Dedupe and limit to MAX_BOOKMAKERS
  const uniqueBooks = [...new Set(bookmakers)];
  return uniqueBooks.slice(0, MAX_BOOKMAKERS);
}

// Helper function to filter bookmakers based on user plan
function getBookmakersForPlan(userPlan) {
  if (userPlan === 'platinum') {
    return FOCUSED_BOOKMAKERS; // Full access to all bookmakers
  }
  return TRIAL_BOOKMAKERS; // Trial users get only 3 major books
}

// Helper function to build event odds URLs consistently
function buildEventOddsUrl({ sportKey, eventId, apiKey, regions = "us", markets, bookmakers = [] }) {
  const baseUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds`;
  const params = new URLSearchParams({
    apiKey,
    regions,
    oddsFormat: "american"
  });
  
  if (markets) {
    params.append('markets', Array.isArray(markets) ? markets.join(',') : markets);
  }
  
  if (bookmakers && bookmakers.length > 0) {
    params.append('bookmakers', Array.isArray(bookmakers) ? bookmakers.join(',') : bookmakers);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// Helper function to get or create user profile
async function getUserProfile(userId) {
  if (!supabase) {
    // Fallback to in-memory storage if Supabase not configured
    if (!userUsage.has(userId)) {
      userUsage.set(userId, { api_request_count: 0, plan: 'free' });
    }
    return userUsage.get(userId);
  }

  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  if (error && error.code === "PGRST116") {
    // User doesn't exist, create them
    const { data: inserted, error: insertErr } = await supabase
      .from("users")
      .insert({ id: userId, plan: "free", api_request_count: 0 })
      .select("*")
      .single();
    if (insertErr) throw insertErr;
    return inserted;
  }
  if (error) throw error;
  
  // Check if platinum subscription has expired
  if (data.plan === 'platinum' && data.subscription_end_date) {
    const now = new Date();
    const endDate = new Date(data.subscription_end_date);
    
    if (now > endDate) {
      // Subscription expired, downgrade to free
      const { error: updateError } = await supabase
        .from("users")
        .update({ plan: "free" })
        .eq("id", userId);
        
      if (!updateError) {
        data.plan = "free";
        console.log(`⏰ Subscription expired for user: ${userId}`);
      }
    }
  }
  
  return data;
}

// Middleware to require authenticated user
function requireUser(req, res, next) {
  const isReadOnlyGet = req.method === 'GET';
  const userId = req.user?.id || req.headers["x-user-id"] || (isReadOnlyGet ? 'demo-user' : undefined);
  if (!userId) return res.status(401).json({ error: "UNAUTHENTICATED" });
  req.__userId = userId;
  next();
}

// Enhanced axios wrapper with retry logic and quota diagnostics
async function axiosWithRetry(url, options = {}, { tries = 2, backoffMs = 700 } = {}) {
  const axiosConfig = {
    timeout: 9000,
    ...options
  };
  
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const response = await axios.get(url, axiosConfig);
      
      // Log quota information
      const remaining = response.headers['x-requests-remaining'];
      const used = response.headers['x-requests-used'];
      if (remaining !== undefined || used !== undefined) {
        console.log(`API Quota - Remaining: ${remaining || 'N/A'}, Used: ${used || 'N/A'}`);
      }
      
      return response;
    } catch (error) {
      const status = error.response?.status;
      const isLastAttempt = attempt === tries;
      
      // Don't retry quota/plan limit errors
      if (status === 402 || status === 429) {
        console.error(`API quota/plan limit hit (${status}):`, error.response?.data);
        throw error;
      }
      
      // Retry transient errors with exponential backoff
      if (!isLastAttempt && (status >= 500 || !status)) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        console.warn(`Attempt ${attempt} failed (${status || 'timeout'}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
}

if (!API_KEY) {
  console.warn("⚠️  Missing ODDS_API_KEY in .env (odds endpoints will still work for ESPN scores).");
}

// Configure CORS
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:10000',
  'https://odds-frontend-j2pn.onrender.com',
  'https://my-react-frontend-021i.onrender.com',
  // Primary production domains (correct spelling)
  'https://oddsightseer.com',
  'https://www.oddsightseer.com'
]);

// Add FRONTEND_URL if it exists and isn't already in the set
if (process.env.FRONTEND_URL) {
  allowedOrigins.add(process.env.FRONTEND_URL);
}

console.log('🔄 CORS Allowed Origins:', Array.from(allowedOrigins));

// Create CORS middleware with proper origin validation
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // In development, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, stripe-signature, x-user-id, Cache-Control, Pragma, Expires');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return next();
  }
  
  // In production, only allow whitelisted origins
  if (!origin || allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, stripe-signature, x-user-id, Cache-Control, Pragma, Expires');
    res.header('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return next();
  }
  
  console.log('🚫 CORS blocked origin:', origin);
  return res.status(403).json({ error: 'Not allowed by CORS' });
};

// Trust proxy (Render/Heroku) for correct IPs in rate-limiting
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Apply CORS middleware
app.use(corsMiddleware);

// Attempt to authenticate user (populate req.user) if Authorization header is present
async function authenticate(req, _res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token && supabase && typeof supabase.auth?.getUser === 'function') {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        req.user = data.user;
      }
    }
  } catch (e) {
    // Non-fatal: continue without req.user
    console.warn('Auth token verification failed:', e.message);
  }
  next();
}

// Apply authentication on API routes
app.use('/api', authenticate);

// Basic API rate limiting (production only)
if (process.env.NODE_ENV === 'production') {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'rate_limited', hint: 'Too many requests, please try again later.' },
  });
  app.use('/api/', apiLimiter);
}

// Use JSON parser for most routes, but skip Stripe webhook which requires raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') return next();
  return bodyParser.json()(req, res, next);
});

// Serve static client build if available
const path = require('path');
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
try {
  app.use(express.static(clientBuildPath));
} catch (_) {
  // ok if not present locally
}

// Usage tracking middleware for Odds API proxy
async function trackUsage(req, res, next) {
  try {
    const userId = req.__userId;
    const profile = await getUserProfile(userId);

    // Enforce quota for non-platinum users
    if (profile.plan !== "platinum" && profile.api_request_count >= FREE_QUOTA) {
      return res.status(402).json({
        error: "QUOTA_EXCEEDED",
        code: "QUOTA_EXCEEDED",
        used: profile.api_request_count,
        quota: FREE_QUOTA,
        message: "You've reached the free 250 request limit. Upgrade to continue."
      });
    }

    // Store profile for later use
    req.__userProfile = profile;
    next();
  } catch (error) {
    console.error('Usage tracking error:', error);
    // In production, allow request to continue instead of failing
    // This prevents 500 errors when Supabase is misconfigured
    req.__userProfile = { plan: 'free', api_request_count: 0 };
    next();
  }
}

// Lightweight usage gate used by public GET endpoints to prevent accidental abuse.
// Currently a no-op that forwards the request; retain hook for future expansion.
function enforceUsage(req, res, next) {
  return next();
}

// Increment usage after successful API call
async function incrementUsage(userId, profile) {
  if (!profile || !userId) return; // Guard missing context
  if (profile.plan === "platinum") return; // Platinum users don't count against quota

  if (supabase) {
    try {
      // Try atomic increment function first
      const { error: rpcError } = await supabase.rpc("increment_usage", { uid: userId });
      if (rpcError) {
        // Fallback to update if RPC not available
        await supabase.from("users")
          .update({ api_request_count: profile.api_request_count + 1 })
          .eq("id", userId);
      }
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
  } else {
    // Fallback to in-memory storage
    const userData = userUsage.get(userId);
    if (userData) {
      userData.api_request_count += 1;
      userUsage.set(userId, userData);
    }
  }
}

// Health check endpoints (for Render and monitors)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// Readiness endpoint with non-secret env presence for quick verification
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    hasStripePrice: !!process.env.STRIPE_PRICE_PLATINUM,
    hasStripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSupabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    frontendUrl: process.env.FRONTEND_URL || null,
    version: process.env.GIT_COMMIT || process.env.RENDER_GIT_COMMIT || null,
  });
});

// Usage endpoint - get current user's quota info
app.get('/api/me/usage', requireUser, async (req, res) => {
  try {
    const profile = await getUserProfile(req.__userId);
    res.json({
      userId: profile.id,
      plan: profile.plan,
      used: profile.api_request_count,
      quota: profile.plan === "platinum" ? null : FREE_QUOTA
    });
  } catch (error) {
    console.error('me/usage error:', error);
    res.status(500).json({ error: "USAGE_FETCH_FAILED" });
  }
});

// Odds API proxy with usage tracking
// Proxy only explicit Odds API endpoints to avoid path-to-regexp wildcards
app.get('/api/odds/v4/sports/:sportKey/events/:eventId/odds', requireUser, trackUsage, async (req, res) => {
  try {
    const userId = req.__userId;
    const profile = req.__userProfile;

    // Proxy to Odds API
    const { sportKey, eventId } = req.params;
    const upstreamPath = `/v4/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds`;
    const upstreamUrl = `https://api.the-odds-api.com${upstreamPath}`;
    
    const response = await axios.get(upstreamUrl, { 
      params: { ...req.query, apiKey: API_KEY },
      timeout: 9000
    });

    // If success, increment usage for non-platinum users
    if (response.status === 200) {
      await incrementUsage(userId, profile);
    }

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Odds proxy error:", error?.response?.data || error.message);
    const status = error?.response?.status || 500;
    return res.status(status).json({ error: "PROXY_FAILED", detail: error.message });
  }
});

// Explicit Odds API proxies (Express 5-safe)
app.get('/api/odds/v4/sports', enforceUsage, async (_req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ code: 'MISSING_ENV', message: "Missing ODDS_API_KEY", hint: 'Set ODDS_API_KEY in backend env' });
    const upstreamUrl = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const r = await axios.get(upstreamUrl);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'proxy_failed', detail: err?.response?.data || err.message });
  }
});

app.get('/api/odds/v4/sports/:sportKey/events', enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ code: 'MISSING_ENV', message: "Missing ODDS_API_KEY", hint: 'Set ODDS_API_KEY in backend env' });
    const { sportKey } = req.params;
    const upstreamUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/events?apiKey=${API_KEY}`;
    const r = await axios.get(upstreamUrl);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'proxy_failed', detail: err?.response?.data || err.message });
  }
});

app.get('/api/odds/v4/sports/:sportKey/odds', enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ code: 'MISSING_ENV', message: "Missing ODDS_API_KEY", hint: 'Set ODDS_API_KEY in backend env' });
    const { sportKey } = req.params;
    const { regions = 'us', markets = 'h2h,spreads,totals', oddsFormat = 'american', bookmakers, dateFormat, includeBetLimits } = req.query;
    const qs = new URLSearchParams({ apiKey: API_KEY, regions, markets, oddsFormat });
    if (bookmakers) qs.set('bookmakers', String(bookmakers));
    if (dateFormat) qs.set('dateFormat', String(dateFormat));
    if (includeBetLimits) qs.set('includeBetLimits', String(includeBetLimits));
    const upstreamUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds?${qs.toString()}`;
    const r = await axios.get(upstreamUrl);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'proxy_failed', detail: err?.response?.data || err.message });
  }
});

// Legacy usage endpoint
app.get('/api/usage/me', requireUser, async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    // Fetch user plan from database
    let userPlan = 'free_trial'; // default
    if (userId !== 'demo-user') {
      const { data: user, error } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single();
      
      if (!error && user?.plan) {
        userPlan = user.plan;
      }
    }
    
    if (userPlan === 'platinum') {
      return res.json({
        plan: 'platinum',
        limit: null,
        calls_made: null,
        remaining: null,
        period_end: null
      });
    }
    
    // Free trial: return current month usage
    const { start, end } = currentMonthlyWindow();
    const periodKey = `${userId}-${start.toISOString()}`;
    const usage = userUsage.get(periodKey) || { calls_made: 0 };
    
    res.json({
      plan: userPlan || 'free_trial',
      limit: FREE_QUOTA,
      calls_made: usage.calls_made,
      remaining: Math.max(0, FREE_QUOTA - usage.calls_made),
      period_end: end.toISOString()
    });
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Stripe: Create checkout session for Platinum subscription
app.post('/api/billing/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured', hint: 'Set STRIPE_SECRET_KEY in backend env' });
    }
    
    if (!STRIPE_PRICE_PLATINUM) {
      return res.status(500).json({ code: 'MISSING_ENV', message: 'STRIPE_PRICE_PLATINUM not set', hint: 'Set STRIPE_PRICE_PLATINUM (Price ID)' });
    }
    
    const { supabaseUserId } = req.body;
    
    // Require authentication
    if (!supabaseUserId) {
      return res.status(400).json({ code: 'AUTH_REQUIRED', message: 'Missing supabaseUserId', hint: 'Ensure frontend passes authenticated user id' });
    }
    
    console.log(`Creating checkout session for user: ${supabaseUserId}`);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: STRIPE_PRICE_PLATINUM,
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/billing/cancel`,
      allow_promotion_codes: true,
      metadata: { 
        userId: supabaseUserId, 
        plan: 'platinum' 
      }
    });
    
    console.log(`Created checkout session: ${session.id} for user: ${supabaseUserId}`);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'CHECKOUT_START_FAILED', detail: error.message });
  }
});

// Server logout endpoint - clears HTTP-only session cookies if any
app.post('/api/logout', (req, res) => {
  // Clear any session cookies that might be set
  res.clearCookie('session', { path: '/', sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.clearCookie('auth-token', { path: '/', sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  return res.json({ ok: true });
});

// Admin endpoint to sign out all users (invalidate all sessions)
app.post('/api/admin/signout-all', async (req, res) => {
  try {
    // Require admin token
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || token !== ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('🔐 Admin: Signing out all users');
    
    // Use Supabase Admin API to sign out all users
    const { data, error } = await supabase.auth.admin.signOutAllUsers();
    
    if (error) {
      console.error('Failed to sign out all users:', error);
      return res.status(500).json({ error: 'Failed to sign out users', details: error.message });
    }
    
    console.log('✅ Successfully signed out all users');
    return res.json({ 
      ok: true, 
      message: 'All users have been signed out',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error signing out all users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin override route to grant platinum manually
app.post("/api/admin/set-plan", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, plan } = req.body;
  if (!userId || !plan) {
    return res.status(400).json({ error: "Missing userId or plan" });
  }

  if (!supabase) {
    // Fallback to in-memory storage
    const userData = userUsage.get(userId) || { api_request_count: 0, plan: 'free' };
    userData.plan = plan;
    userUsage.set(userId, userData);
    return res.json({ ok: true, userId, plan });
  }

  try {
    const { error } = await supabase.from("users").update({ plan }).eq("id", userId);
    if (error) {
      return res.status(500).json({ error: "SET_PLAN_FAILED", detail: error.message });
    }

    console.log(`✅ Admin granted platinum to user: ${userId}`);
    res.json({ ok: true, userId });
  } catch (error) {
    console.error('grant-platinum error:', error);
    res.status(500).json({ error: 'GRANT_PLATINUM_FAILED', detail: error.message });
  }
});

// Set user plan (for free trial)
app.post('/api/users/plan', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ error: 'auth_required' });
    }

    const { plan } = req.body || {};
    if (plan !== 'free_trial') {
      return res.status(400).json({ error: 'invalid_plan' });
    }

    console.log(`Setting plan for user ${userId}: ${plan}`);

    if (supabase) {
      // Update user plan in Supabase
      const { error } = await supabase
        .from('users')
        .upsert({ 
          id: userId, 
          plan: 'free_trial',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to update user plan:', error);
        return res.status(500).json({ error: 'database_error' });
      }
    } else {
      return res.status(500).json({ error: "SUPABASE_REQUIRED", message: "Supabase connection required for plan management" });
    }

    res.json({ ok: true, plan: 'free_trial' });
  } catch (error) {
    console.error('Error setting user plan:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Cancel Stripe subscription
app.post('/api/billing/cancel-subscription', requireUser, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const userId = req.__userId;
    
    // Get user's current subscription from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Set subscription end date instead of immediately removing access
    const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_end_date: subscriptionEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return res.status(500).json({ error: 'Failed to update user plan' });
    }

    res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook handler (raw body required for signature verification)
app.post('/api/billing/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured' });
    }
    
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        
        if (userId && supabase) {
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
          
          // Update user plan and subscription end date in Supabase
          const { error } = await supabase
            .from('users')
            .update({ 
              plan: 'platinum',
              subscription_end_date: subscriptionEndDate.toISOString()
            })
            .eq('id', userId);
            
          if (error) {
            console.error('Failed to update user plan in Supabase:', error);
            throw error;
          }
          
          console.log(`✅ Plan set to platinum via webhook: ${userId}, expires: ${subscriptionEndDate}`);
        } else {
          console.error(`Failed to update plan in Supabase for user ${userId}`);
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).send('Webhook handler failed');
    }
  }
);

// sports list (Odds API) - CACHED to reduce API calls
app.get("/api/sports", requireUser, trackUsage, async (_req, res) => {
  try {
    // If no API key, return fallback sports list
    if (!API_KEY) {
      const fallbackSports = [
        { key: "americanfootball_nfl", title: "NFL", active: true },
        { key: "americanfootball_ncaaf", title: "NCAAF", active: true },
        { key: "basketball_nba", title: "NBA", active: true },
        { key: "basketball_ncaab", title: "NCAAB", active: true },
        { key: "baseball_mlb", title: "MLB", active: true },
        { key: "icehockey_nhl", title: "NHL", active: true },
        { key: "soccer_epl", title: "EPL", active: true },
        { key: "soccer_uefa_champs_league", title: "UCL", active: true },
        { key: "mma_mixed_martial_arts", title: "MMA", active: true },
        { key: "boxing_boxing", title: "Boxing", active: true }
      ];
      console.log('🧪 Returning fallback sports list - API key not configured');
      return res.json(fallbackSports);
    }
    
    // Check cache first - sports list rarely changes
    const cacheKey = getCacheKey('sports', {});
    const cachedSports = getCachedResponse(cacheKey);
    
    if (cachedSports) {
      console.log('📦 Using cached sports list');
      return res.json(cachedSports);
    }
    
    console.log('🌐 API call for sports list');
    const url = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const r = await axios.get(url);
    
    // Cache for longer since sports list is stable
    setCachedResponse(cacheKey, r.data);
    res.json(r.data);
  } catch (err) {
    console.error("sports error:", err?.response?.status, err?.response?.data || err.message);
    res.status(500).json({ error: String(err) });
  }
});

// events by sport (Odds API) - CACHED to reduce API calls
app.get("/api/events", enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const { sport } = req.query;
    if (!sport) return res.status(400).json({ error: "Missing sport" });
    
    // Check cache first
    const cacheKey = getCacheKey('events', { sport });
    const cachedEvents = getCachedResponse(cacheKey);
    
    if (cachedEvents) {
      console.log(`📦 Using cached events for ${sport}`);
      return res.json(cachedEvents);
    }
    
    console.log(`🌐 API call for events: ${sport}`);
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events?apiKey=${API_KEY}`;
    const r = await axios.get(url);
    const events = Array.isArray(r.data) ? r.data : (r.data ? Object.values(r.data) : []);
    
    setCachedResponse(cacheKey, events);
    res.json(events);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("events error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: String(err) });
  }
});

// odds endpoint (unified for multiple sports)
app.get("/api/odds", requireUser, trackUsage, async (req, res) => {
  try {
    const { sports, regions = "us", markets = "h2h,spreads,totals", oddsFormat = "american" } = req.query;
    if (!sports) return res.status(400).json({ error: "Missing sports parameter" });
    
    // If no API key, return error instead of mock data
    if (!API_KEY) {
      console.log('🔧 No API_KEY found, returning error');
      return res.status(500).json({ 
        error: "ODDS_API_KEY not configured", 
        message: "Please configure ODDS_API_KEY environment variable" 
      });
    }
    
    const sportsArray = sports.split(',');
    const marketsArray = markets.split(',');
    let allGames = [];
    
    // Filter out player props entirely
    const regularMarkets = marketsArray.filter(m => !m.includes('player_') && !m.includes('batter_') && !m.includes('pitcher_'));
    
    if (marketsArray.some(m => m.includes('player_') || m.includes('batter_') || m.includes('pitcher_'))) {
      console.log('🚫 Player prop markets requested but not supported');
      return res.status(400).json({ error: "Player prop markets are not supported" });
    }
    console.log('Regular markets requested:', regularMarkets);
    
    // Step 1: Fetch regular odds (h2h, spreads, totals) only
    if (regularMarkets.length > 0) {
      const marketsToFetch = regularMarkets;
      
      // Fetch each sport separately since TheOddsAPI doesn't support multiple sports in one request
      for (const sport of sportsArray) {
        try {
          // COST REDUCTION: Use bookmakers based on user plan
          const userProfile = req.__userProfile || { plan: 'free' };
          const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
          const bookmakerList = allowedBookmakers.join(',');
          const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${marketsToFetch.join(',')}&oddsFormat=${oddsFormat}&bookmakers=${bookmakerList}`;
          // Check cache first to avoid redundant API calls
          const cacheKey = getCacheKey('odds', { sport, regions, markets: marketsToFetch, bookmakers: bookmakerList });
          const cachedData = getCachedResponse(cacheKey);
          
          let response;
          if (cachedData) {
            response = { data: cachedData };
            console.log(`📦 Using cached data for ${sport}`);
          } else {
            console.log(`🌐 API call for ${sport}:`, url);
            response = await axios.get(url);
            setCachedResponse(cacheKey, response.data);
          }
          const sportGames = response.data || [];
          console.log(`Got ${sportGames.length} games for ${sport}`);
          
          allGames.push(...sportGames);
        } catch (sportErr) {
          console.warn(`Failed to fetch games for sport ${sport}:`, sportErr.response?.status, sportErr.response?.data || sportErr.message);
          // Continue with other sports even if one fails
        }
      }
      
      console.log(`Got ${allGames.length} total games with base markets`);
      
      // Filter bookmakers based on user plan before returning
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      allGames.forEach(game => {
        game.bookmakers = game.bookmakers.filter(bookmaker => 
          allowedBookmakers.includes(bookmaker.key)
        );
      });

    }
    
    console.log(`Returning ${allGames.length} games total`);
    
    // Increment usage counter for successful API calls
    const userId = req.__userId;
    const profile = req.__userProfile;
    if (userId && profile) {
      await incrementUsage(userId, profile);
    }
    
    res.json(allGames);
  } catch (err) {
    console.error("odds error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});


// odds snapshot (Odds API) - legacy endpoint
app.get("/api/odds-data", enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const sport = req.query.sport || "basketball_nba";
    const regions = req.query.regions || "us";
    const markets = req.query.markets || "h2h,spreads,totals";
    const oddsFormat = req.query.oddsFormat || "american";
    const includeBetLimits = req.query.includeBetLimits;

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(
      sport
    )}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}${
      includeBetLimits ? `&includeBetLimits=${encodeURIComponent(includeBetLimits)}` : ""
    }`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    console.error("odds-data error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});


/* ---------------------------- ESPN Scores (NFL/NCAAF) ---------------------------- */
/**
 * GET /api/scores?sport=americanfootball_nfl|americanfootball_ncaaf&date=YYYY-MM-DD
 * Returns:
 *  - id, home_team, away_team
 *  - home_logo, away_logo
 *  - home_record, away_record
 *  - home_rank, away_rank
 *  - status ("scheduled" | "in_progress" | "final"), clock
 *  - scores { home, away }
 *  - commence_time (ISO)
 *  - week, season, league ("nfl" | "college-football")
 */
// ---------- Scores (ESPN public JSON; logos, records, ranks, week) ----------
// ---------- Scores (ESPN with logos/records/ranks robust) ----------
app.get("/api/scores", enforceUsage, async (req, res) => {
  try {
    const sport = String(req.query.sport || "americanfootball_nfl").toLowerCase();
    const dateParam = (req.query.date || "").toString().replace(/-/g, "");

    const LEAGUE = {
      americanfootball_nfl: "nfl",
      americanfootball_ncaaf: "college-football",
      basketball_nba: "nba",
      basketball_ncaab: "mens-college-basketball",
      basketball_wnba: "wnba",
      icehockey_nhl: "nhl",
      soccer_epl: "eng.1",
      soccer_uefa_champs_league: "uefa.champions",
      baseball_mlb: "mlb"
    };
    const leagueSlug = LEAGUE[sport] || "nfl";
    
    // Different ESPN API endpoints for different sports
    let baseUrl;
    if (sport.includes("football")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${leagueSlug}/scoreboard`;
    } else if (sport.includes("basketball")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/${leagueSlug}/scoreboard`;
    } else if (sport.includes("hockey")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/hockey/${leagueSlug}/scoreboard`;
    } else if (sport.includes("soccer")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/scoreboard`;
    } else if (sport.includes("baseball")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/${leagueSlug}/scoreboard`;
    } else {
      // Default fallback
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;
    }

    const axiosOpts = { 
      timeout: 15_000,
      headers: {
        'User-Agent': 'VR-Odds/1.0 (Sports Betting Platform)',
        'Accept': 'application/json'
      }
    };
    // Only add date param for historical data, not for live scores
    if (dateParam && dateParam !== new Date().toISOString().slice(0, 10).replace(/-/g, "")) {
      axiosOpts.params = { dates: dateParam };
    }

    const r = await axios.get(baseUrl, axiosOpts);
    const events = Array.isArray(r.data?.events) ? r.data.events : [];
    const week = r.data?.week?.number ?? r.data?.week ?? null;
    const season = (r.data?.season && (r.data.season.year || r.data.season)) || null;

    // helpers
    const firstLogoFrom = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const raw = arr[0]?.href || arr[0]?.url || arr[0];
      if (!raw) return "";
      try {
        const u = new URL(String(raw));
        if (u.protocol !== "https:") u.protocol = "https:";
        // small, transparent PNG helps consistency
        u.searchParams.set("format", "png");
        u.searchParams.set("bgc", "transparent");
        u.searchParams.set("h", "80");
        return u.toString();
      } catch {
        return String(raw);
      }
    };

    const getLogo = (competitor = {}) => {
      const team = competitor.team || {};
      // Most common: team.logos[]
      let logo =
        firstLogoFrom(team.logos) ||
        (team.logo ? String(team.logo) : "") ||
        // Rare older shape: competitor.logos[]
        firstLogoFrom(competitor.logos);
      return logo || "";
    };

    const getRecord = (competitor = {}) => {
      // Preferred: competitor.records[].summary (ESPN uses this)
      if (Array.isArray(competitor.records) && competitor.records.length) {
        const withSummary = competitor.records.find((x) => x && x.summary);
        if (withSummary?.summary) return String(withSummary.summary);
      }
      if (competitor.recordSummary) return String(competitor.recordSummary);

      // Fallbacks on team:
      const team = competitor.team || {};
      const tRecs = team.records || team.record;
      if (Array.isArray(tRecs) && tRecs.length) {
        const withSummary = tRecs.find((x) => x && x.summary);
        if (withSummary?.summary) return String(withSummary.summary);
      }
      return null;
    };

    const getRank = (competitor = {}) => {
      // College football often uses curatedRank.current
      const curated = competitor.curatedRank?.current;
      if (Number.isFinite(Number(curated))) return Number(curated);

      if (Number.isFinite(Number(competitor.rank))) return Number(competitor.rank);

      const teamRank = competitor.team?.rank;
      if (Number.isFinite(Number(teamRank))) return Number(teamRank);

      return null;
    };

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Enhanced status detection for more accurate live game identification
    const getGameStatus = (event, competition) => {
      const status = event.status || competition.status || {};
      const type = status.type || {};
      
      // More granular status detection
      if (type.completed === true || type.state === 'post') {
        return 'final';
      }
      
      if (type.state === 'in' || status.displayClock) {
        return 'in_progress';
      }
      
      if (type.state === 'pre' || new Date(event.date) > new Date()) {
        return 'scheduled';
      }
      
      // Only mark as in_progress if explicitly indicated by ESPN status
      // Don't use fallback logic that could incorrectly mark games as live
      return 'scheduled';
    };

    const statusTuple = (e, comp) => {
      const st = e.status || comp.status || {};
      const t = st.type || {};
      const status = t.completed ? "final" : (t.state === "in" ? "in_progress" : "scheduled");
      const clock =
        (t.state === "in" ? (t.shortDetail || t.detail) : (t.state === "pre" ? "" : t.shortDetail)) ||
        (status === "final" ? "Final" : "");
      return { status, clock };
    };

    const games = events.map((e) => {
      const comp = Array.isArray(e.competitions) ? e.competitions[0] : e.competitions || {};
      const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];

      const home = competitors.find((c) => c.homeAway === "home") || {};
      const away = competitors.find((c) => c.homeAway === "away") || {};

      const homeTeam = home.team || {};
      const awayTeam = away.team || {};

      const homeName = homeTeam.displayName || homeTeam.name || "Home";
      const awayName = awayTeam.displayName || awayTeam.name || "Away";

      const home_logo = getLogo(home);
      const away_logo = getLogo(away);

      const home_record = getRecord(home);
      const away_record = getRecord(away);

      const home_rank = getRank(home);
      const away_rank = getRank(away);

      const homeScore = toNum(home.score);
      const awayScore = toNum(away.score);

      const { status, clock } = statusTuple(e, comp);
      const enhancedStatus = getGameStatus(e, comp);
      
      // Enhanced clock information for live games
      let enhancedClock = clock;
      if (enhancedStatus === 'in_progress') {
        const statusType = e.status?.type || comp.status?.type || {};
        enhancedClock = statusType.displayClock || 
                       statusType.shortDetail || 
                       statusType.detail || 
                       clock || 
                       'Live';
      }

      // ESPN sometimes includes odds; keep if present
      let vegasLine = null;
      let overUnder = null;
      let provider = "ESPN";
      if (Array.isArray(comp.odds) && comp.odds.length) {
        const o = comp.odds[0];
        if (o?.spread) vegasLine = o.spread;
        if (o?.overUnder != null) overUnder = toNum(o.overUnder);
        if (o?.details) provider = o.details;
      }

      return {
        id: e.id || comp.id || `${awayName}-${homeName}-${e.date}`,
        sport_key: sport,
        home_team: homeName,
        away_team: awayName,
        home_logo,
        away_logo,
        home_record,
        away_record,
        home_rank,
        away_rank,
        commence_time: e.date,
        status: enhancedStatus,
        scores: { home: homeScore ?? 0, away: awayScore ?? 0 },
        clock: enhancedClock,
        // Enhanced live game metadata
        completed: enhancedStatus === 'final',
        live: enhancedStatus === 'in_progress' && 
              (homeScore > 0 || awayScore > 0) && 
              new Date(e.date) <= new Date(),
        period: e.status?.period || comp.status?.period || null,
        situation: e.status?.type?.situation || null,
        week: r.data?.week?.number ?? r.data?.week ?? null,
        season: (r.data?.season && (r.data.season.year || r.data.season)) || null,
        league: leagueSlug,
        odds:
          vegasLine || overUnder != null
            ? { spread: vegasLine, overUnder, provider }
            : null,
      };
    });

    // Enhanced sorting: Live games first, then upcoming by time, then completed by time desc
    games.sort((a, b) => {
      // Prioritize live games
      if (a.live && !b.live) return -1;
      if (!a.live && b.live) return 1;
      
      // Among live games, sort by commence time
      if (a.live && b.live) {
        return new Date(a.commence_time) - new Date(b.commence_time);
      }
      
      // Among non-live games, upcoming first, then completed
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;
      
      // Within same category, sort by time (upcoming: asc, completed: desc)
      const timeA = new Date(a.commence_time);
      const timeB = new Date(b.commence_time);
      
      return a.completed ? timeB - timeA : timeA - timeB;
    });

    // Dynamic cache control based on live games
    const hasLiveGames = games.some(g => g.live);
    const cacheMaxAge = hasLiveGames ? 15 : 60; // 15s for live games, 60s for others
    res.set("Cache-Control", `public, max-age=${cacheMaxAge}`);
    
    // Add live games count to response headers for client optimization
    res.set("X-Live-Games-Count", games.filter(g => g.live).length.toString());
    res.json(games);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("scores (espn) error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: "scores_espn_failed", detail: err?.response?.data || err.message });
  }
});

/* ------------------------------------ Game Reactions ------------------------------------ */

// Persistent file-based storage for reactions (better than in-memory)
const fs = require('fs');

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
app.get('/api/reactions/:gameKey', enforceUsage, (req, res) => {
  try {
    const { gameKey } = req.params;
    const reactions = gameReactions.get(gameKey) || {};
    res.json({ reactions });
  } catch (err) {
    console.error('Get reactions error:', err);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

// Add or update a reaction
app.post('/api/reactions/:gameKey', (req, res) => {
  try {
    const { gameKey } = req.params;
    const { userId, username, emoji, action } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ error: 'Missing userId or emoji' });
    }

    let reactions = gameReactions.get(gameKey) || {};

    if (action === 'remove') {
      // Remove user's reaction
      Object.keys(reactions).forEach(reactionEmoji => {
        reactions[reactionEmoji] = reactions[reactionEmoji]?.filter(
          user => user.userId !== userId
        ) || [];
        if (reactions[reactionEmoji].length === 0) {
          delete reactions[reactionEmoji];
        }
      });
    } else {
      // Remove user's previous reaction first
      Object.keys(reactions).forEach(reactionEmoji => {
        reactions[reactionEmoji] = reactions[reactionEmoji]?.filter(
          user => user.userId !== userId
        ) || [];
        if (reactions[reactionEmoji].length === 0) {
          delete reactions[reactionEmoji];
        }
      });

      // Add new reaction
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      const existingUser = reactions[emoji].find(user => user.userId === userId);
      if (!existingUser) {
        reactions[emoji].push({
          userId,
          username: username || 'Anonymous',
          timestamp: Date.now()
        });
      }
    }

    gameReactions.set(gameKey, reactions);
    saveReactions(); // Persist to file
    res.json({ reactions });
  } catch (err) {
    console.error('Add reaction error:', err);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Get all reactions summary (for analytics)
app.get('/api/reactions-summary', (req, res) => {
  try {
    const summary = {};
    gameReactions.forEach((reactions, gameKey) => {
      const totalReactions = Object.values(reactions).reduce(
        (sum, users) => sum + users.length, 0
      );
      if (totalReactions > 0) {
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


/* ------------------------------------ Start ------------------------------------ */
// SPA fallback: keep last, after static and API routes.
// Use a middleware without a path to catch unmatched GETs in Express 5 safely.
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
