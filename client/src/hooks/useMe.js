// Hook to fetch user plan and drive menu + gate logic
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { withApiBase } from '../config/api';
import { secureFetch } from '../utils/security';
import { apiUsageEvents } from './useMarkets';

export function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchMe = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      if (!supabase) {
        const defaultData = { plan: 'free', remaining: 250, limit: 250, calls_made: 0 };
        if (mountedRef.current) {
          setMe(defaultData);
        }
        return;
      }

      // Simplified session check without timeout complexity
      let hasSession = false;
      try {
        const { data } = await supabase.auth.getSession();
        hasSession = !!data?.session;
      } catch (sessionError) {
        // Continue without session - API will handle demo auth
      }

      // Fetch user data with simplified error handling
      const response = await secureFetch(withApiBase('/api/me/usage'), {
        credentials: 'include',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        // For 500 errors or auth issues, use default free plan data
        const defaultData = { plan: 'free', remaining: 250, limit: 250, calls_made: 0 };
        if (mountedRef.current) {
          setMe(defaultData);
        }
        return;
      }
      
      const userData = await response.json();
      
      const meData = { 
        plan: userData.plan || 'free', 
        remaining: userData.quota ? Math.max(0, userData.quota - userData.used) : 250,
        limit: userData.quota || 250,
        calls_made: userData.used || 0
      };
      
      if (mountedRef.current) {
        setMe(meData);
      }
    } catch (error) {
      console.error('useMe: Error fetching user data:', error);
      // Always provide fallback data to prevent infinite loading
      const defaultData = { plan: 'free', remaining: 250, limit: 250, calls_made: 0 };
      if (mountedRef.current) {
        setMe(defaultData);
        setError(error.message);
      }
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let subscription = null;
    
    // Initial fetch
    fetchMe();
    
    // Set up auth state listener only once
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        // Only refetch on meaningful auth changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          fetchMe();
        }
      });
      subscription = data.subscription;
    }

    // Listen for API usage events to refresh counter
    const handleApiUsage = () => {
      // Debounce the refresh to avoid too many calls
      setTimeout(fetchMe, 1000);
    };
    
    apiUsageEvents.addEventListener('apiCallMade', handleApiUsage);

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      apiUsageEvents.removeEventListener('apiCallMade', handleApiUsage);
    };
  }, []); // Empty dependency array to prevent re-runs

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { me, loading, error, refresh: fetchMe };
}
