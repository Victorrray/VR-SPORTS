// src/hooks/useSessionRenewal.js
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook to automatically renew the user's session before it expires
 * @param {number} renewalTimeMinutes - Minutes before expiry to renew (default: 5)
 */
export const useSessionRenewal = (renewalTimeMinutes = 5) => {
  const { user } = useAuth();
  const timerRef = useRef(null);
  
  useEffect(() => {
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // If no user, don't set up renewal
    if (!user) return;
    
    const setupRenewalTimer = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No active session found for renewal');
          return;
        }
        
        // Calculate expiry time
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        // Calculate time until renewal (session expiry minus renewal buffer)
        const renewalBufferMs = renewalTimeMinutes * 60 * 1000;
        const timeUntilRenewal = expiresAt.getTime() - now.getTime() - renewalBufferMs;
        
        console.log(`Session expires at: ${expiresAt.toLocaleString()}`);
        console.log(`Will renew session in: ${Math.round(timeUntilRenewal / 60000)} minutes`);
        
        // Only set timer if renewal time is positive
        if (timeUntilRenewal > 0) {
          timerRef.current = setTimeout(renewSession, timeUntilRenewal);
        } else {
          // If we're already past the renewal time, renew immediately
          renewSession();
        }
      } catch (error) {
        console.error('Error setting up session renewal:', error);
      }
    };
    
    const renewSession = async () => {
      try {
        console.log('🔄 Renewing auth session...');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session renewal failed:', error);
          return;
        }
        
        console.log('✅ Session renewed successfully');
        
        // Set up the next renewal
        setupRenewalTimer();
      } catch (error) {
        console.error('Error during session renewal:', error);
      }
    };
    
    // Initial setup
    setupRenewalTimer();
    
    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, renewalTimeMinutes]);
};

export default useSessionRenewal;
