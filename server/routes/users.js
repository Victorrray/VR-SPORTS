/**
 * User Routes
 * Endpoints for user profile, usage tracking, and plan management
 */

const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const { getCachedPlan, setCachedPlan } = require('../services/cache');
const { currentMonthlyWindow } = require('../services/helpers');
const { FREE_QUOTA } = require('../config/usage');

/**
 * GET /api/me
 * Returns user plan info (public endpoint, no auth required)
 */
router.get('/me', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const supabase = req.app.locals.supabase;
  
  // Set cache-busting headers to ensure fresh responses
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  if (!userId) {
    return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
  }

  try {
    if (!supabase) {
      return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
    }

    const { data, error } = await supabase
      .from('users')
      .select('plan, api_request_count, grandfathered, subscription_end_date, stripe_customer_id, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('User not found, returning free plan');
      return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
    }

    // Platinum or grandfathered = unlimited
    if (data.plan === 'platinum' || data.grandfathered) {
      console.log(`✅ User ${userId} has platinum plan (grandfathered: ${data.grandfathered})`);
      return res.json({
        plan: 'platinum',
        remaining: null,
        limit: null,
        unlimited: true,
        used: data.api_request_count || 0,
        subscription_end_date: data.subscription_end_date,
        has_billing: !!data.stripe_customer_id,
        created_at: data.created_at
      });
    }

    // Gold plan
    if (data.plan === 'gold') {
      console.log(`✅ User ${userId} has gold plan`);
      return res.json({
        plan: 'gold',
        remaining: null,
        limit: null,
        unlimited: false,
        used: data.api_request_count || 0,
        subscription_end_date: data.subscription_end_date,
        has_billing: !!data.stripe_customer_id,
        created_at: data.created_at
      });
    }

    // New users (plan = null) or free plan = 250 limit
    const limit = 250;
    const used = data.api_request_count || 0;
    const remaining = Math.max(0, limit - used);

    console.log(`📊 User ${userId} plan: ${data.plan || 'free'}`);
    res.json({
      plan: data.plan || 'free', // null becomes 'free' for display
      remaining,
      limit,
      used,
      unlimited: false,
      subscription_end_date: data.subscription_end_date,
      has_billing: !!data.stripe_customer_id,
      created_at: data.created_at
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
  }
});

/**
 * GET /api/me/usage
 * Get current user's quota info (requires authentication)
 */
router.get('/me/usage', requireUser, async (req, res) => {
  const userId = req.__userId;
  const cached = getCachedPlan(userId);
  const supabase = req.app.locals.supabase;
  const userUsage = req.app.locals.userUsage;

  try {
    const { getUserProfile } = require('../middleware/auth');
    const profile = await getUserProfile(userId, supabase, userUsage);

    // Handle demo mode when Supabase is not configured
    if (!supabase && userUsage.has(userId)) {
      const userData = userUsage.get(userId);
      const payload = {
        id: userData.id,
        plan: userData.plan,
        used: userData.api_request_count,
        quota: userData.plan === "platinum" ? null : FREE_QUOTA,
        source: 'demo'
      };
      setCachedPlan(userId, payload);
      return res.json(payload);
    }

    const payload = {
      id: profile.id,
      plan: profile.plan,
      used: profile.api_request_count,
      quota: profile.plan === "platinum" ? null : FREE_QUOTA,
      source: 'live'
    };
    setCachedPlan(userId, payload);
    return res.json(payload);
  } catch (error) {
    console.error('me/usage error:', error);
    if (cached) {
      return res.json({ ...cached, source: 'cache', stale: true });
    }
    return res.status(503).json({ error: "USAGE_FETCH_FAILED", detail: error.message });
  }
});

/**
 * GET /api/usage/me
 * Legacy usage endpoint
 */
router.get('/usage/me', requireUser, async (req, res) => {
  try {
    const userId = req.__userId;
    const supabase = req.app.locals.supabase;
    const userUsage = req.app.locals.userUsage;

    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'SUPABASE_REQUIRED', detail: 'Supabase connection required for usage lookup' });
    }

    // Fetch user plan from database
    let userPlan = 'free_trial'; // default
    const { data: user, error } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();
    
    if (!error && user?.plan) {
      userPlan = user.plan;
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

/**
 * POST /api/users/plan
 * Set user plan (for free trial)
 */
router.post('/plan', requireUser, async (req, res) => {
  try {
    const userId = req.__userId;
    const supabase = req.app.locals.supabase;
    const userUsage = req.app.locals.userUsage;

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

module.exports = router;
