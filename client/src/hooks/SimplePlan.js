import { useState, useEffect } from 'react';
import { useAuth } from './SimpleAuth';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export function usePlan() {
  const { user, authLoading } = useAuth();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPlan(null);
      setPlanLoading(false);
      return;
    }

    // Fetch plan once when user logs in
    setPlanLoading(true);
    axios.get(`${API_BASE_URL}/api/me`, {
      headers: { 'x-user-id': user.id }
    })
    .then(res => {
      console.log('✅ Plan loaded:', res.data);
      setPlan(res.data);
      setPlanLoading(false);
    })
    .catch(err => {
      console.error('❌ Plan fetch error:', err);
      // Default to free plan on error
      setPlan({ plan: 'free', remaining: 250, limit: 250 });
      setPlanLoading(false);
    });
  }, [user?.id, authLoading]);

  const refreshPlan = async () => {
    if (!user) return null;
    
    try {
      const res = await axios.get(`${API_BASE_URL}/api/me`, {
        headers: { 'x-user-id': user.id }
      });
      setPlan(res.data);
      return res.data;
    } catch (err) {
      console.error('Plan refresh error:', err);
      return plan;
    }
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
  const { plan, planLoading } = usePlan();

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
    refresh: async () => {}
  };
}
