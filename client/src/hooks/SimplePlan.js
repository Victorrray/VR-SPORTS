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
      setPlan(null);
      setPlanLoading(false);
      return;
    }

    setPlanLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/me`, {
        headers: { 'x-user-id': user.id }
      });
      console.log('✅ Plan loaded:', res.data);
      setPlan(res.data);
      setPlanLoading(false);
    } catch (err) {
      console.error('❌ Plan fetch error:', err);
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
    fetchPlan();
  }, [user?.id, authLoading]);

  // Refresh plan when page becomes visible (user returns to tab)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible - refreshing plan');
        fetchPlan();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  const refreshPlan = async () => {
    if (!user) return null;
    
    console.log('🔄 Manual plan refresh triggered');
    await fetchPlan();
    return plan;
  };

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

  return {
    me,
    loading: authLoading || planLoading,
    error: null,
    refresh: refreshPlan // Expose refresh function
  };
}
