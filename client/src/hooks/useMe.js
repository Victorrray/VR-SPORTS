// Hook to fetch user plan and drive menu + gate logic
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withApiBase } from '../config/api';
import { secureFetch } from '../utils/security';

export function useMe() {
  console.log('🔍 useMe: Hook initialized');
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    console.log('🔍 useMe: fetchMe function called');
    setLoading(true);
    try {
      console.log('🔍 useMe: Checking supabase client:', !!supabase);
      if (!supabase) {
        console.log('🔍 useMe: No supabase client, setting default data');
        setMe({ plan: 'free', remaining: 250, limit: 250, calls_made: 0 });
        return;
      }

      console.log('🔍 useMe: Getting session from supabase');
      
      // Add timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );
      
      let session;
      try {
        const { data } = await Promise.race([sessionPromise, timeoutPromise]);
        session = data;
        console.log('🔍 useMe: Session result:', !!session?.session);
      } catch (error) {
        console.log('🔍 useMe: Session timeout or error, proceeding with default data');
        setMe({ plan: 'free', remaining: 250, limit: 250, calls_made: 0 });
        return;
      }
      
      if (!session.session) { 
        console.log('🔍 useMe: No session, setting default data');
        setMe({ plan: 'free', remaining: 250, limit: 250, calls_made: 0 }); 
        return; 
      }

      console.log('🔍 useMe: Fetching user data from /api/me/usage');
      // Fetch user plan and usage info from backend
      const response = await secureFetch(withApiBase('/api/me/usage'), {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        console.error('🔍 useMe: Failed to fetch user data:', response.status);
        // Set default data instead of null to prevent infinite loading
        setMe({ plan: 'free', remaining: 250, limit: 250, calls_made: 0 });
        return;
      }
      
      const userData = await response.json();
      console.log('🔍 useMe: Received user data:', userData);
      
      const meData = { 
        plan: userData.plan || 'free', 
        remaining: userData.quota ? Math.max(0, userData.quota - userData.used) : null,
        limit: userData.quota || 250,
        calls_made: userData.used || 0
      };
      
      console.log('🔍 useMe: Setting me data:', meData);
      setMe(meData);
    } catch (error) {
      console.error('🔍 useMe: Error fetching user data:', error);
      // Set default data instead of null to prevent infinite loading
      setMe({ plan: 'free', remaining: 250, limit: 250, calls_made: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 useMe: useEffect running, calling fetchMe');
    console.log('🔍 useMe: fetchMe function is:', typeof fetchMe);
    fetchMe().catch(err => console.error('🔍 useMe: fetchMe error:', err));
    
    // Listen for auth state changes and refetch user data
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        fetchMe();
      });

      return () => subscription.unsubscribe();
    }
  }, [fetchMe]);

  return { me, loading, refresh: fetchMe };
}
