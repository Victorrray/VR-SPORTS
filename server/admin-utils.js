// server/admin-utils.js
// Supabase-based admin utilities for plan management

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

/**
 * Grant platinum access to a user
 * @param {string} userId - User ID to grant platinum access
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function grantPlatinum(userId) {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({ 
        plan: 'platinum',
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log(`✅ Admin granted platinum to user: ${userId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Revoke platinum access (set to free)
 * @param {string} userId - User ID to revoke platinum access
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function revokePlatinum(userId) {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({ 
        plan: 'free',
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log(`✅ Admin revoked platinum from user: ${userId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all platinum users
 * @returns {Promise<{success: boolean, users?: Array, error?: string}>}
 */
async function getPlatinumUsers() {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, plan, api_request_count, created_at, updated_at")
      .eq("plan", "platinum")
      .order("updated_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, users: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user plan and usage info
 * @param {string} userId - User ID to check
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
async function getUserInfo(userId) {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Bulk grant platinum to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @returns {Promise<{success: boolean, results?: Array, error?: string}>}
 */
async function bulkGrantPlatinum(userIds) {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const results = [];
  
  for (const userId of userIds) {
    const result = await grantPlatinum(userId);
    results.push({ userId, ...result });
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Bulk platinum grant: ${successCount}/${userIds.length} successful`);

  return { success: true, results };
}

/**
 * Set plan expiration date (for trial management)
 * @param {string} userId - User ID
 * @param {Date} expirationDate - When the plan expires
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function setPlanExpiration(userId, expirationDate) {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({ 
        trial_ends: expirationDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log(`✅ Set plan expiration for user ${userId}: ${expirationDate}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  grantPlatinum,
  revokePlatinum,
  getPlatinumUsers,
  getUserInfo,
  bulkGrantPlatinum,
  setPlanExpiration
};
