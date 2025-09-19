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
  const lastMeRef = useRef(null);

  const fetchMe = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log('🔍 useMe: Already fetching, skipping');
      return;
    }
    
    console.log('🔍 useMe: Starting fetch');
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      if (!supabase) {
        console.log('🔍 useMe: No supabase, using default data');
        const defaultData = { plan: 'free', remaining: 250, limit: 250, calls_made: 0, stale: false };
        if (mountedRef.current) {
          setMe(defaultData);
          lastMeRef.current = defaultData;
        }
        return;
      }

      // Simplified session check without timeout complexity
      let hasSession = false;
      try {
        const { data } = await supabase.auth.getSession();
        hasSession = !!data?.session;
        console.log('🔍 useMe: Session check:', hasSession);
      } catch (sessionError) {
        console.log('🔍 useMe: Session error:', sessionError);
        // Continue without session - API will handle demo auth
      }

      // Fetch user data with simplified error handling
      console.log('🔍 useMe: Fetching from:', withApiBase('/api/me/usage'));
      const response = await secureFetch(withApiBase('/api/me/usage'), {
        credentials: 'include',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('🔍 useMe: Response status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('🔍 useMe: Response not ok, keeping existing plan state');
        if (mountedRef.current) {
          if (lastMeRef.current) {
            setMe(lastMeRef.current);
          } else {
            const defaultData = { plan: 'free', remaining: 250, limit: 250, calls_made: 0, stale: false };
            setMe(defaultData);
            lastMeRef.current = defaultData;
          }
        }
        return;
      }
      
      const userData = await response.json();
      console.log('🔍 useMe: User data received:', userData);
      
      const meData = {
        plan: userData.plan || 'free',
        remaining: userData.quota ? Math.max(0, userData.quota - userData.used) : 250,
        limit: userData.quota || 250,
        calls_made: userData.used || 0,
        stale: Boolean(userData.stale)
      };
      
      console.log('🔍 useMe: Processed meData:', meData);
      
      if (mountedRef.current) {
        setMe(meData);
        lastMeRef.current = meData;
      }
    } catch (error) {
      console.error('useMe: Error fetching user data:', error);
      if (mountedRef.current) {
        if (lastMeRef.current) {
          setMe(lastMeRef.current);
        } else {
          const defaultData = { plan: 'free', remaining: 250, limit: 250, calls_made: 0, stale: false };
          setMe(defaultData);
          lastMeRef.current = defaultData;
        }
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
