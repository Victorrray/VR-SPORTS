import { useState, useEffect } from 'react';
import { useAuth } from './SimpleAuth';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export function usePlan() {
  const { user, authLoading } = useAuth();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  const fetchPlan = async () => {
    if (!user) {
      console.log('🔄 No user, skipping plan fetch');
      setPlan(null);
      setPlanLoading(false);
      return;
    }

    setPlanLoading(true);
    try {
      console.log('🔄 Fetching plan for user:', user.id);
      console.log('🔄 API URL:', `${API_BASE_URL}/api/me`);
      
      // Get Supabase session token for authentication
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
      }
      
      const token = session?.access_token;
      console.log('🔐 Session token available:', !!token);
      console.log('🔐 Session user:', session?.user?.id);
      
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
      
      console.log('🔄 Request headers:', { 'x-user-id': user.id, hasAuth: !!token, cacheBuster });
      
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
      
      console.log('✅ Plan API response:', res.data);
      console.log('✅ Plan value:', res.data.plan);
      console.log('✅ Unlimited:', res.data.unlimited);
      console.log('✅ Used:', res.data.used);
      console.log('✅ Remaining:', res.data.remaining);
      console.log('✅ Response headers:', res.headers);
      
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
  };

  // Fetch plan when user logs in or user ID changes
  useEffect(() => {
    if (authLoading) return;
    
    // Reset plan when user changes (sign out/sign in)
    if (!user) {
      console.log('🔄 User signed out - clearing plan');
      setPlan(null);
      setPlanLoading(false);
      return;
    }
    
    console.log('🔄 User changed - fetching plan for:', user.id);
    console.log('🔄 Current plan state:', plan);
    fetchPlan();
  }, [user?.id, authLoading]);

  // Refresh plan when page becomes visible (user returns to tab) and periodically
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible - refreshing plan');
        fetchPlan();
      }
    };

    // Refresh plan every 30 seconds while page is visible
    const planRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Periodic plan refresh (30s interval)');
        fetchPlan();
      }
    }, 30000); // 30 seconds

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(planRefreshInterval);
    };
  }, [user?.id]);

  const refreshPlan = async () => {
    if (!user) return null;
    
    console.log('🔄 Manual plan refresh triggered for user:', user.id);
    
    // Clear any cached data
    try {
      // Clear localStorage cache
      localStorage.removeItem('userPlan');
      localStorage.removeItem('me');
      localStorage.removeItem('plan');
      console.log('✅ Cleared localStorage cache');
    } catch (e) {
      console.warn('⚠️ Could not clear localStorage:', e);
    }
    
    // Force a fresh fetch by clearing any browser cache
    await fetchPlan();
    console.log('✅ Plan refresh complete, new plan:', plan);
    return plan;
  };

  // Listen for plan update events from admin panel
  useEffect(() => {
    const handlePlanUpdate = () => {
      console.log('📢 Plan update event received, refreshing...');
      fetchPlan();
    };

    window.addEventListener('planUpdated', handlePlanUpdate);
    return () => window.removeEventListener('planUpdated', handlePlanUpdate);
  }, [user?.id]);

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
    unlimited: plan.unlimited || false
  } : {
    plan: 'free',
    remaining: 250,
    limit: 250,
    calls_made: 0,
    unlimited: false
  };

  // Debug logging for useMe hook
  console.log('🎯 useMe hook - returning me object:', {
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
