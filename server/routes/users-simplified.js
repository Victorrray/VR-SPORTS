/**
 * SIMPLIFIED User Routes
 * Clean, simple endpoints for user plan and usage
 */

const express = require('express');
const router = express.Router();
const { extractUserId, requireAuth, getUserPlan, setCachedPlan } = require('../middleware/auth-simplified');

// ============================================================================
// GET /api/me
// ============================================================================
// Get user's plan info
// NO authentication required - public endpoint
// Returns: { plan, unlimited, used }

router.get('/me', extractUserId, async (req, res) => {
  try {
    const userId = req.__userId;
    const supabase = req.app.locals.supabase;
    const userUsage = req.app.locals.userUsage;

    // Set cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    if (!userId) {
      return res.json({
        plan: 'free',
        unlimited: false,
        used: 0
      });
    }

    // Get user's plan
    const userPlan = await getUserPlan(userId, supabase, userUsage);

    res.json({
      plan: userPlan.plan,
      unlimited: userPlan.unlimited,
      used: 0
    });
  } catch (error) {
    console.error('❌ /api/me error:', error);
    res.json({
      plan: 'free',
      unlimited: false,
      used: 0
    });
  }
});

// ============================================================================
// GET /api/me/usage
// ============================================================================
// Get user's quota info
// REQUIRES authentication
// Returns: { id, plan, used, quota, unlimited }

router.get('/me/usage', extractUserId, requireAuth, async (req, res) => {
  try {
    const userId = req.__userId;
    const userPlan = req.__userPlan;

    res.json({
      id: userId,
      plan: userPlan.plan,
      used: 0,
      quota: userPlan.unlimited ? null : 250,
      unlimited: userPlan.unlimited
    });
  } catch (error) {
    console.error('❌ /api/me/usage error:', error);
    res.status(500).json({
      error: 'USAGE_FETCH_FAILED',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/users/plan
// ============================================================================
// Update user's plan
// REQUIRES authentication
// Body: { plan: 'gold' | 'platinum' }

router.post('/plan', extractUserId, requireAuth, async (req, res) => {
  try {
    const userId = req.__userId;
    const supabase = req.app.locals.supabase;
    const { plan } = req.body;

    if (!plan || !['gold', 'platinum'].includes(plan)) {
      return res.status(400).json({
        error: 'INVALID_PLAN',
        message: 'Plan must be "gold" or "platinum"'
      });
    }

    if (!supabase) {
      return res.status(500).json({
        error: 'SUPABASE_REQUIRED',
        message: 'Database connection required'
      });
    }

    // Update user plan in database
    const { error } = await supabase
      .from('users')
      .update({
        plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Failed to update plan:', error);
      return res.status(500).json({
        error: 'DATABASE_ERROR',
        message: error.message
      });
    }

    // Clear cache so user sees update immediately
    const { setCachedPlan } = require('../middleware/auth-simplified');
    setCachedPlan(userId, { plan, unlimited: plan === 'platinum' });

    console.log(`✅ Plan updated: ${userId} → ${plan}`);
    res.json({
      ok: true,
      plan,
      message: `Plan updated to ${plan}`
    });
  } catch (error) {
    console.error('❌ /api/users/plan error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

module.exports = router;
