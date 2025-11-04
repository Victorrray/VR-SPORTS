/**
 * SIMPLIFIED Authentication & Plan Checking
 * Single, clean flow with no confusion
 */

const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const planCache = new Map();

// ============================================================================
// HELPERS
// ============================================================================

function getCachedPlan(userId) {
  const cached = planCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > PLAN_CACHE_TTL_MS) {
    planCache.delete(userId);
    return null;
  }
  return cached.payload;
}

function setCachedPlan(userId, payload) {
  planCache.set(userId, { payload, timestamp: Date.now() });
}

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

// ============================================================================
// STEP 1: EXTRACT USER ID
// ============================================================================
// Get user ID from either JWT token or x-user-id header
// This runs on EVERY request

async function extractUserId(req, _res, next) {
  try {
    // Try to get user from JWT token (from authenticate middleware)
    if (req.user?.id) {
      req.__userId = req.user.id;
      console.log(`🔐 User from JWT: ${req.__userId}`);
      return next();
    }

    // Try to get user from x-user-id header
    const headerUserId = req.headers['x-user-id'];
    if (headerUserId) {
      req.__userId = headerUserId;
      console.log(`🔐 User from header: ${req.__userId}`);
      return next();
    }

    // Demo mode for local development
    if (process.env.ALLOW_DEMO_USER === 'true' && isLocalRequest(req)) {
      req.__userId = 'demo-user';
      console.log(`🔐 Demo user (local development)`);
      return next();
    }

    // No user ID found - that's OK, some endpoints don't require it
    console.log(`🔐 No user ID found`);
    return next();
  } catch (error) {
    console.error('❌ extractUserId error:', error);
    next();
  }
}

// ============================================================================
// STEP 2: GET USER PLAN FROM DATABASE
// ============================================================================
// Fetch user's plan from Supabase (or create if doesn't exist)
// Only called when needed (not on every request)

async function getUserPlan(userId, supabase, userUsage) {
  if (!userId) {
    return { plan: 'free', unlimited: false };
  }

  // Check cache first
  const cached = getCachedPlan(userId);
  if (cached) {
    console.log(`💾 Plan from cache: ${cached.plan}`);
    return cached;
  }

  // Demo mode - use in-memory storage
  if (!supabase) {
    if (!userUsage.has(userId)) {
      userUsage.set(userId, { plan: 'free', api_request_count: 0 });
    }
    const user = userUsage.get(userId);
    const result = {
      plan: user.plan || 'free',
      unlimited: user.plan === 'platinum'
    };
    setCachedPlan(userId, result);
    return result;
  }

  try {
    // Try to fetch user from database
    const { data, error } = await supabase
      .from('users')
      .select('plan, grandfathered')
      .eq('id', userId)
      .single();

    // User exists
    if (data) {
      const result = {
        plan: data.plan || 'free',
        unlimited: data.plan === 'platinum' || data.grandfathered === true
      };
      setCachedPlan(userId, result);
      console.log(`📊 Plan from DB: ${result.plan}`);
      return result;
    }

    // User doesn't exist - create them
    if (error?.code === 'PGRST116') {
      console.log(`🆕 Creating new user: ${userId}`);
      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert({
          id: userId,
          plan: null, // New users have no plan
          api_request_count: 0,
          grandfathered: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('plan, grandfathered')
        .single();

      if (insertErr) {
        console.error('❌ Failed to create user:', insertErr.message);
        // Fallback to free plan
        return { plan: 'free', unlimited: false };
      }

      const result = {
        plan: newUser.plan || 'free',
        unlimited: false
      };
      setCachedPlan(userId, result);
      return result;
    }

    // Other database error
    console.error('❌ Database error:', error?.message);
    return { plan: 'free', unlimited: false };
  } catch (error) {
    console.error('❌ getUserPlan error:', error);
    return { plan: 'free', unlimited: false };
  }
}

// ============================================================================
// STEP 3: REQUIRE AUTHENTICATION
// ============================================================================
// Middleware: Require user to be authenticated
// Sets req.__userId and req.__userPlan

async function requireAuth(req, res, next) {
  const userId = req.__userId;

  if (!userId) {
    return res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Authentication required'
    });
  }

  // Get user's plan
  const supabase = req.app.locals.supabase;
  const userUsage = req.app.locals.userUsage;
  const userPlan = await getUserPlan(userId, supabase, userUsage);

  req.__userPlan = userPlan;
  console.log(`✅ Auth OK: ${userId} (${userPlan.plan})`);
  next();
}

// ============================================================================
// STEP 4: REQUIRE PAID PLAN
// ============================================================================
// Middleware: Require user to have gold or platinum plan
// Must be used AFTER requireAuth

async function requirePaidPlan(req, res, next) {
  const userId = req.__userId;
  const supabase = req.app.locals.supabase;
  const userUsage = req.app.locals.userUsage;

  // Get user's plan
  const userPlan = await getUserPlan(userId, supabase, userUsage);
  req.__userPlan = userPlan;

  // Check if user has paid plan
  if (userPlan.unlimited || userPlan.plan === 'gold' || userPlan.plan === 'platinum') {
    console.log(`✅ Paid plan OK: ${userId} (${userPlan.plan})`);
    return next();
  }

  // User has free plan or no plan
  return res.status(402).json({
    error: 'SUBSCRIPTION_REQUIRED',
    message: 'Paid plan required. Upgrade to Gold ($10/month) or Platinum ($25/month)',
    plan: userPlan.plan
  });
}

// ============================================================================
// STEP 5: AUTHENTICATE JWT TOKEN
// ============================================================================
// Middleware: Verify JWT token and set req.user
// This runs on EVERY request

async function authenticate(req, _res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const supabase = req.app.locals.supabase;

    if (!token || !supabase) {
      return next();
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);

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

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Middleware
  authenticate,
  extractUserId,
  requireAuth,
  requirePaidPlan,

  // Helpers
  getUserPlan,
  getCachedPlan,
  setCachedPlan,
  isLocalRequest
};
