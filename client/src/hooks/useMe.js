// Hook to fetch user plan and drive menu + gate logic
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { 
        setMe(null); 
        return; 
      }

      // Fetch user plan and usage info from backend
      const response = await fetch('/api/usage/me', { 
        credentials: 'include',
        headers: {
          'x-user-id': session.session.user.id
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user data:', response.status);
        setMe(null);
        return;
      }
      
      const userData = await response.json();
      setMe({ 
        plan: userData.plan || null, 
        remaining: userData.remaining || null,
        limit: userData.limit || null,
        calls_made: userData.calls_made || null
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    
    // Listen for auth state changes and refetch user data
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, !!session);
      fetchMe();
    });

    return () => subscription.unsubscribe();
  }, [fetchMe]);

  return { me, loading, refresh: fetchMe };
}
