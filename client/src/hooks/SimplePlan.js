import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './SimpleAuth';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Set to true only when debugging plan issues
const DEBUG_PLAN = false;

export function usePlan() {
  const { user, authLoading } = useAuth();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      if (DEBUG_PLAN) console.log('🔄 No user, skipping plan fetch');
      setPlan(null);
      setPlanLoading(false);
      return;
    }

    setPlanLoading(true);
    try {
      if (DEBUG_PLAN) console.log('🔄 Fetching plan for user:', user.id);
      if (DEBUG_PLAN) console.log('🔄 API URL:', `${API_BASE_URL}/api/me`);
      
      // Get Supabase session token for authentication
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
      }
      
      const token = session?.access_token;
      if (DEBUG_PLAN) console.log('🔐 Session token available:', !!token);
      if (DEBUG_PLAN) console.log('🔐 Session user:', session?.user?.id);
      
      // Generate unique cache buster
      const cacheBuster = Date.now();
      
      const headers = { 
        'x-user-id': user.id,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Cache-Buster': cacheBuster.toString()
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (DEBUG_PLAN) console.log('🔄 Request headers:', { 'x-user-id': user.id, hasAuth: !!token, cacheBuster });
      
      // Use axios config to prevent caching
      const res = await axios.get(`${API_BASE_URL}/api/me?t=${cacheBuster}&_=${cacheBuster}`, { 
        headers,
        // Prevent axios from caching
        timeout: 10000,
        // Force fresh request
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });
      
      if (DEBUG_PLAN) console.log('✅ Plan API response:', res.data);
      if (DEBUG_PLAN) console.log('✅ Plan value:', res.data.plan);
      if (DEBUG_PLAN) console.log('✅ Unlimited:', res.data.unlimited);
      if (DEBUG_PLAN) console.log('✅ Used:', res.data.used);
      if (DEBUG_PLAN) console.log('✅ Remaining:', res.data.remaining);
      if (DEBUG_PLAN) console.log('✅ Response headers:', res.headers);
      
      // Validate response
      if (!res.data || !res.data.plan) {
        console.warn('⚠️ Invalid plan response:', res.data);
        setPlan({ plan: 'free', remaining: 250, limit: 250 });
      } else {
        setPlan(res.data);
      }
      setPlanLoading(false);
    } catch (err) {
      console.error('❌ Plan fetch error:', err.message);
      console.error('❌ Error details:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Full error:', err);
      // Default to free plan on error
      setPlan({ plan: 'free', remaining: 250, limit: 250 });
      setPlanLoading(false);
    }
  }, [user?.id]);

  // Fetch plan when user logs in or user ID changes
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (DEBUG_PLAN) console.log('🔄 User signed out - clearing plan');
      setPlan(null);
      setPlanLoading(false);
      return;
    }

    if (DEBUG_PLAN) console.log('🔄 User changed - fetching plan for:', user.id);
    fetchPlan();
  }, [user?.id, authLoading, fetchPlan]);

  const refreshPlan = async () => {
    if (!user) return;

    if (DEBUG_PLAN) console.log('🔄 Manual plan refresh triggered for user:', user.id);

    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
      if (DEBUG_PLAN) console.log('✅ Cleared localStorage cache');
    } catch (e) {
      console.warn('⚠️ Could not clear localStorage:', e);
    }

    await fetchPlan();
  };

  // Listen for plan update events from admin panel
  useEffect(() => {
    const handlePlanUpdate = () => {
      if (DEBUG_PLAN) console.log('📢 Plan update event received, refreshing...');
      fetchPlan();
    };

    window.addEventListener('planUpdated', handlePlanUpdate);
    return () => window.removeEventListener('planUpdated', handlePlanUpdate);
  }, [fetchPlan]);

  // Auto-clear plan cache on page load/mount (preserve user preferences)
  useEffect(() => {
    if (DEBUG_PLAN) console.log('🧹 Clearing plan cache on component mount (preserving bankroll & sportsbooks)');
    try {
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
    } catch (e) {
      console.warn('⚠️ Could not clear cache on mount:', e);
    }
  }, []);

  return { 
    plan, 
    planLoading,
    refreshPlan
  };
}

// Simplified useMe - just returns plan data
export function useMe() {
  const { user, authLoading } = useAuth();
  const { plan, planLoading, refreshPlan } = usePlan();

  const me = plan ? {
    plan: plan.plan || 'free',
    remaining: plan.remaining,
    limit: plan.limit,
    calls_made: plan.used || 0,
    unlimited: plan.unlimited || false,
    subscription_end_date: plan.subscription_end_date,
    cancel_at_period_end: plan.cancel_at_period_end || false,
    has_billing: plan.has_billing || false
  } : {
    plan: 'free',
    remaining: 250,
    limit: 250,
    calls_made: 0,
    unlimited: false,
    subscription_end_date: null,
    cancel_at_period_end: false,
    has_billing: false
  };

  // Debug logging for useMe hook
  if (DEBUG_PLAN) console.log('🎯 useMe hook - returning me object:', {
    plan: me.plan,
    unlimited: me.unlimited,
    rawPlan: plan,
    loading: authLoading || planLoading,
    userId: user?.id
  });

  return {
    me,
    loading: authLoading || planLoading,
    error: null,
    refresh: refreshPlan // Expose refresh function
  };
}
