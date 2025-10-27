/**
 * Admin Routes
 * Endpoints for administrative operations (requires ADMIN_API_KEY)
 */

const express = require('express');
const router = express.Router();
const { ADMIN_API_KEY } = require('../config/constants');

/**
 * Middleware: Verify admin API key
 */
function requireAdminKey(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  
  if (!token || token !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
}

/**
 * POST /api/admin/signout-all
 * Sign out all users (invalidate all sessions)
 */
router.post('/signout-all', requireAdminKey, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
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

/**
 * POST /api/admin/set-plan
 * Grant or change user plan (admin override)
 */
router.post('/set-plan', requireAdminKey, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userUsage = req.app.locals.userUsage;
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

    const { error } = await supabase.from("users").update({ plan }).eq("id", userId);
    if (error) {
      return res.status(500).json({ error: "SET_PLAN_FAILED", detail: error.message });
    }

    console.log(`✅ Admin set plan for user: ${userId} to ${plan}`);
    res.json({ ok: true, userId, plan });
  } catch (error) {
    console.error('set-plan error:', error);
    res.status(500).json({ error: 'SET_PLAN_FAILED', detail: error.message });
  }
});

module.exports = router;
