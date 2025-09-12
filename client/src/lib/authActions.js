// Robust sign-out action - single source of truth
import { supabase } from './supabase';
import { debugLog, debugRedirectDecision } from './debug';

const FLOW_V2_ENABLED = (() => {
  try {
    return import.meta.env?.VITE_FLOW_V2 !== '0';
  } catch (e) {
    return process.env.REACT_APP_FLOW_V2 !== '0';
  }
})(); // Default ON, can be disabled

/**
 * Signs out user and redirects to specified path
 * Clears all auth state, localStorage, and caches
 * @param {Function} navigate - React Router navigate function
 * @param {string} redirectPath - Path to redirect to after sign out (default: '/')
 * @param {boolean} debug - Enable debug logging (default: false)
 */
export async function signOutAndRedirect(navigate, redirectPath = '/', debug = false) {
  const debugAuth = debug || new URLSearchParams(window.location.search).has('debugAuth');
  
  try {
    debugLog('AUTH', 'Starting sign out process');
    
    // 1) Supabase: clear session for all tabs
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('🔐 signOutAndRedirect: Supabase sign out error:', error);
        // Continue with cleanup even if Supabase fails
      } else {
        debugLog('AUTH', 'Supabase sign out successful');
      }
    }

    // 2) Clear app-local state
    localStorage.removeItem('pricingIntent');  // from billing flow
    localStorage.removeItem('userSelectedSportsbooks'); // user preferences
    localStorage.removeItem('supabase.auth.token'); // legacy token storage
    sessionStorage.clear();
    
    if (debugAuth) console.log('🔐 signOutAndRedirect: Cleared localStorage and sessionStorage');

    // 3) Call server logout endpoint to clear any HTTP-only cookies
    try {
      const { withApiBase } = require('../config/api');
      await fetch(withApiBase('/api/logout'), { method: 'POST', credentials: 'include' });
      if (debugAuth) console.log('🔐 signOutAndRedirect: Server logout successful');
    } catch (logoutError) {
      if (debugAuth) console.warn('🔐 signOutAndRedirect: Server logout failed:', logoutError);
    }

    // 4) Optional: clear SW caches if using service worker
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.allSettled(keys.map(k => caches.delete(k)));
        if (debugAuth) console.log('🔐 signOutAndRedirect: Cleared service worker caches');
      } catch (cacheError) {
        if (debugAuth) console.warn('🔐 signOutAndRedirect: Cache clearing failed:', cacheError);
      }
    }

    // 5) Navigate
    if (debugAuth) console.log('🔐 signOutAndRedirect: Redirecting to:', redirectPath);
    navigate(redirectPath, { replace: true });
    
  } catch (error) {
    console.error('🔐 signOutAndRedirect: Sign out failed:', error);
    // Graceful fallback navigation even on error
    if (debugAuth) console.log('🔐 signOutAndRedirect: Error fallback - redirecting to:', redirectPath);
    navigate(redirectPath, { replace: true });
  }
}

/**
 * Alternative sign out that forces a full page refresh
 * Use when React state might be corrupted or for maximum reliability
 * @param {string} redirectPath - Path to redirect to after sign out (default: '/')
 * @param {boolean} debug - Enable debug logging (default: false)
 */
export async function signOutAndRefresh(redirectPath = '/', debug = false) {
  const debugAuth = debug || new URLSearchParams(window.location.search).has('debugAuth');
  
  try {
    if (debugAuth) console.log('🔐 signOutAndRefresh: Starting sign out with refresh...');
    
    // 1) Supabase: clear session for all tabs
    if (supabase) {
      try {
        const { error } = await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase signOut timeout')), 3000))
        ]);
        if (error) {
          console.error('🔐 signOutAndRefresh: Supabase sign out error:', error);
        } else {
          if (debugAuth) console.log('🔐 signOutAndRefresh: Supabase sign out successful');
        }
      } catch (timeoutError) {
        if (debugAuth) console.warn('🔐 signOutAndRefresh: Supabase sign out timeout, continuing anyway:', timeoutError);
      }
    }

    // 2) Clear app-local state
    localStorage.removeItem('pricingIntent');
    localStorage.removeItem('userSelectedSportsbooks');
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    // 3) Call server logout endpoint to clear any HTTP-only cookies
    try {
      const { withApiBase: withApiBase2 } = require('../config/api');
      await fetch(withApiBase2('/api/logout'), { method: 'POST', credentials: 'include' });
      if (debugAuth) console.log('🔐 signOutAndRefresh: Server logout successful');
    } catch (logoutError) {
      if (debugAuth) console.warn('🔐 signOutAndRefresh: Server logout failed:', logoutError);
    }
    
    if (debugAuth) console.log('🔐 signOutAndRefresh: Cleared storage, forcing page refresh to:', redirectPath);
    
    // 4) Force a page refresh to clear all React state
    window.location.href = redirectPath;
    
  } catch (error) {
    console.error('🔐 signOutAndRefresh: Sign out failed:', error);
    // Graceful fallback
    if (debugAuth) console.log('🔐 signOutAndRefresh: Error fallback - forcing refresh to:', redirectPath);
    window.location.href = redirectPath;
  }
}
