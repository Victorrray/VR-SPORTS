/**
 * Authentication & Authorization Middleware
 * Handles user authentication, plan access control, and usage tracking
 */

const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const planCache = new Map();
const allowDemoUserFallback = String(process.env.ALLOW_DEMO_USER || '').toLowerCase() === 'true';
// REMOVE_API_LIMITS should ONLY work in development, never in production
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const REMOVE_API_LIMITS = !IS_PRODUCTION && process.env.REMOVE_API_LIMITS === 'true';

/**
 * Helper: Check if request is from local development environment
 */
function isLocalRequest(req) {
  const host = (req.get('host') || '').toLowerCase();
  const origin = (req.get('origin') || '').toLowerCase();
  const ip = req.ip || '';
  const check = (value = '') => (
    value.startsWith('localhost') ||
    value.startsWith('127.0.0.1') ||
    value.endsWith('.local')
  );
  return check(host) || check(origin) || ip === '127.0.0.1' || ip === '::1';
}

/**
 * Helper: Get cached plan for user
 */
function getCachedPlan(userId) {
  const cached = planCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > PLAN_CACHE_TTL_MS) {
    planCache.delete(userId);
    return null;
  }
  return cached.payload;
}

/**
 * Helper: Set cached plan for user
 */
function setCachedPlan(userId, payload) {
  planCache.set(userId, { payload, timestamp: Date.now() });
}

/**
 * Helper: Get or create user profile from Supabase
 */
async function getUserProfile(userId, supabase, userUsage) {
  if (!supabase) {
    // Fallback to in-memory storage if Supabase not configured
    if (!userUsage.has(userId)) {
      userUsage.set(userId, {
        id: userId,
        plan: 'free',
        api_request_count: 0,
        created_at: new Date().toISOString()
      });
    }
    return userUsage.get(userId);
  }

  try {
    // First, try to get existing user
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // User doesn't exist, create them
      console.log(`🆕 Creating new user: ${userId}`);
      
      // Create user with all required fields
      const newUser = {
        id: userId,
        plan: null, // New users must subscribe
        api_request_count: 0,
        grandfathered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert(newUser)
        .select("*")
        .single();

      if (insertErr) {
        console.error('❌ Failed to create user:', insertErr);
        
        // Check if it's a constraint violation
        if (insertErr.code === '23514') {
          console.error('❌ Plan constraint violation - database constraint too restrictive');
          throw new Error('Database constraint error: Plan constraint prevents NULL values. Please run the database fix.');
        }
        
        // Check if it's a missing column error
        if (insertErr.code === '42703') {
          console.error('❌ Missing column error:', insertErr.message);
          throw new Error('Database schema error: Missing required columns. Please run the database fix.');
        }
        
        throw new Error(`Database error creating user: ${insertErr.message} (Code: ${insertErr.code})`);
      }

      console.log(`✅ Successfully created user: ${userId}`);
      return inserted;
    }

    if (error) {
      console.error('❌ Database error fetching user:', error);
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
    }

    return data;

  } catch (error) {
    console.error('❌ getUserProfile error:', error);
    throw error;
  }
}

/**
 * Middleware: Require authenticated user
 * Validates user token and sets req.__userId
 */
function requireUser(req, res, next) {
  const isReadOnlyGet = req.method === 'GET';
  const tokenUserId = req.user?.id;
  const headerUserId = req.headers["x-user-id"];

  console.log(`🔐 requireUser: path=${req.path}, method=${req.method}, hasUser=${!!req.user}, tokenUserId=${tokenUserId}, headerUserId=${headerUserId}`);

  if (tokenUserId) {
    if (headerUserId && headerUserId !== tokenUserId) {
      console.log(`❌ requireUser: Header user mismatch - token=${tokenUserId}, header=${headerUserId}`);
      return res.status(401).json({ error: "UNAUTHENTICATED", detail: "Header user mismatch" });
    }
    req.__userId = tokenUserId;
    console.log(`✅ requireUser: Authenticated user ${tokenUserId}`);
    return next();
  }

  if (allowDemoUserFallback && isReadOnlyGet && isLocalRequest(req)) {
    req.__userId = 'demo-user';
    console.log(`✅ requireUser: Demo user fallback`);
    return next();
  }

  console.log(`❌ requireUser: No valid user - rejecting with 401`);
  return res.status(401).json({ error: "UNAUTHENTICATED" });
}

/**
 * Middleware: Check plan access and subscription status
 * Validates user has active subscription and sets req.__userProfile
 */
async function checkPlanAccess(req, res, next) {
  try {
    const userId = req.__userId;
    
    // TESTING MODE: If REMOVE_API_LIMITS is enabled (DEV ONLY), grant unlimited access
    // This is automatically disabled in production (NODE_ENV=production or RENDER=true)
    if (REMOVE_API_LIMITS) {
      console.log('🧪 TESTING MODE (DEV ONLY): API limits removed - granting unlimited access');
      req.__userProfile = {
        id: userId || 'test-user',
        plan: 'platinum',
        username: 'Test User',
        grandfathered: false
      };
      return next();
    }
    
    // DEMO MODE: Give demo-user platinum access
    if (userId === 'demo-user') {
      console.log('💎 Demo user - granting Platinum access');
      req.__userProfile = {
        id: 'demo-user',
        plan: 'platinum',
        username: 'Demo User',
        grandfathered: false
      };
      return next();
    }
    
    const supabase = req.app.locals.supabase;
    const userUsage = req.app.locals.userUsage;
    const profile = await getUserProfile(userId, supabase, userUsage);

    // Gold or Platinum plan (and grandfathered users) get full access
    if (profile.plan === 'gold' || profile.plan === 'platinum' || profile.grandfathered) {
      req.__userProfile = profile;
      return next();
    }

    // TEMPORARY: Allow new users (plan = NULL) limited access to set username and basic functionality
    if (profile.plan === null) {
      console.log(`🆕 Allowing temporary access for new user: ${userId}`);
      req.__userProfile = profile;
      req.__limitedAccess = true; // Flag for limited access
      return next();
    }

    // No valid plan - require subscription
    return res.status(402).json({
      error: "SUBSCRIPTION_REQUIRED",
      code: "SUBSCRIPTION_REQUIRED",
      message: "Subscription required. Choose Gold ($10/month) or Platinum ($25/month) to access live odds and betting data."
    });

  } catch (error) {
    console.error('Plan access check error:', error);
    // In production, deny access on error for security
    return res.status(500).json({
      error: "PLAN_CHECK_FAILED",
      code: "PLAN_CHECK_FAILED", 
      message: "Unable to verify subscription status. Please try again."
    });
  }
}

/**
 * Middleware: Lightweight usage gate for public endpoints
 * Currently a no-op; can be expanded for future rate limiting
 */
function enforceUsage(req, res, next) {
  return next();
}

/**
 * Middleware: Authenticate user from Authorization header
 * Populates req.user if valid token provided
 */
async function authenticate(req, _res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    // Use supabaseAuth for JWT verification (uses anon key), fallback to supabase (service role)
    const supabaseAuth = req.app.locals.supabaseAuth || req.app.locals.supabase;
    
    console.log(`🔍 Auth middleware: path=${req.path}, hasToken=${!!token}, hasSupabaseAuth=${!!supabaseAuth}`);
    
    if (!token || !supabaseAuth) {
      console.log(`⚠️ Auth skipped: token=${!!token}, supabaseAuth=${!!supabaseAuth}`);
      return next();
    }
    
    try {
      // Use getUser() to verify the token - this is the correct Supabase method
      const { data, error } = await supabaseAuth.auth.getUser(token);
      
      if (!error && data?.user) {
        req.user = data.user;
        console.log(`✅ JWT verified: ${data.user.id}`);
      } else if (error) {
        console.warn(`⚠️ JWT verification failed: ${error.message}`);
      }
    } catch (tokenError) {
      console.warn(`⚠️ JWT verification exception: ${tokenError.message}`);
    }
  } catch (e) {
    console.warn(`❌ Auth middleware error: ${e.message}`);
  }
  next();
}

module.exports = {
  requireUser,
  checkPlanAccess,
  enforceUsage,
  authenticate,
  getUserProfile,
  getCachedPlan,
  setCachedPlan,
  isLocalRequest
};
