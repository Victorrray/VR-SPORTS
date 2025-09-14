// Robust sign-out action - single source of truth
import { supabase } from './supabase';
import { debugLog, debugRedirectDecision } from './debug';

/**
 * Simplified, reliable sign out function with comprehensive error handling
 * @param {Object} options - Sign out options
 * @param {Function} options.navigate - React Router navigate function (optional)
 * @param {string} options.redirectPath - Path to redirect to after sign out (default: '/')
 * @param {boolean} options.forceRefresh - Force page refresh instead of navigation (default: false)
 * @param {Function} options.onProgress - Progress callback for UI feedback (optional)
 * @param {Function} options.onError - Error callback for UI feedback (optional)
 * @param {boolean} options.debug - Enable debug logging (default: false)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signOut({
  navigate = null,
  redirectPath = '/',
  forceRefresh = false,
  onProgress = null,
  onError = null,
  debug = false
} = {}) {
  const debugAuth = debug || new URLSearchParams(window.location.search).has('debugAuth');
  const steps = [];
  let currentStep = 0;
  
  // Define all cleanup steps
  const cleanupSteps = [
    { name: 'Supabase sign out', key: 'supabase' },
    { name: 'Clear local storage', key: 'localStorage' },
    { name: 'Server logout', key: 'serverLogout' },
    { name: 'Clear caches', key: 'caches' },
    { name: 'Redirect', key: 'redirect' }
  ];
  
  const updateProgress = (step, status = 'in_progress') => {
    if (onProgress) {
      onProgress({
        step: step,
        current: currentStep + 1,
        total: cleanupSteps.length,
        status: status
      });
    }
  };
  
  try {
    if (debugAuth) console.log('🔐 signOut: Starting comprehensive sign out process...');
    
    // Step 1: Supabase sign out with timeout and retry
    currentStep = 0;
    updateProgress(cleanupSteps[currentStep].name);
    
    if (supabase) {
      try {
        const { error } = await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]);
        
        if (error) {
          console.warn('🔐 signOut: Supabase error (continuing):', error.message);
          steps.push({ step: 'supabase', success: false, error: error.message });
        } else {
          if (debugAuth) console.log('🔐 signOut: Supabase sign out successful');
          steps.push({ step: 'supabase', success: true });
        }
      } catch (timeoutError) {
        console.warn('🔐 signOut: Supabase timeout (continuing):', timeoutError.message);
        steps.push({ step: 'supabase', success: false, error: 'Timeout' });
      }
    } else {
      if (debugAuth) console.log('🔐 signOut: Supabase not available, skipping');
      steps.push({ step: 'supabase', success: true, skipped: true });
    }
    
    updateProgress(cleanupSteps[currentStep].name, 'completed');

    // Step 2: Clear all local storage and session data
    currentStep = 1;
    updateProgress(cleanupSteps[currentStep].name);
    
    try {
      // Clear auth-related items
      const authItems = [
        'pricingIntent',
        'userSelectedSportsbooks', 
        'supabase.auth.token',
        'demo-auth-session',
        'sb-' // Supabase keys typically start with sb-
      ];
      
      // Remove specific items
      authItems.forEach(item => {
        if (item === 'sb-') {
          // Remove all Supabase keys
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        } else {
          localStorage.removeItem(item);
        }
      });
      
      // Clear session storage
      sessionStorage.clear();
      
      if (debugAuth) console.log('🔐 signOut: Local storage cleared');
      steps.push({ step: 'localStorage', success: true });
    } catch (storageError) {
      console.warn('🔐 signOut: Storage clearing failed:', storageError);
      steps.push({ step: 'localStorage', success: false, error: storageError.message });
    }
    
    updateProgress(cleanupSteps[currentStep].name, 'completed');

    // Step 3: Server logout (non-blocking)
    currentStep = 2;
    updateProgress(cleanupSteps[currentStep].name);
    
    try {
      // Import withApiBase dynamically to avoid require() issues
      const { withApiBase } = await import('../config/api');
      const response = await Promise.race([
        fetch(withApiBase('/api/logout'), { 
          method: 'POST', 
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Server logout timeout')), 2000)
        )
      ]);
      
      if (response.ok) {
        if (debugAuth) console.log('🔐 signOut: Server logout successful');
        steps.push({ step: 'serverLogout', success: true });
      } else {
        console.warn('🔐 signOut: Server logout failed with status:', response.status);
        steps.push({ step: 'serverLogout', success: false, error: `HTTP ${response.status}` });
      }
    } catch (logoutError) {
      console.warn('🔐 signOut: Server logout failed:', logoutError.message);
      steps.push({ step: 'serverLogout', success: false, error: logoutError.message });
    }
    
    updateProgress(cleanupSteps[currentStep].name, 'completed');

    // Step 4: Clear service worker caches (non-blocking)
    currentStep = 3;
    updateProgress(cleanupSteps[currentStep].name);
    
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.allSettled(keys.map(k => caches.delete(k)));
        if (debugAuth) console.log('🔐 signOut: Service worker caches cleared');
        steps.push({ step: 'caches', success: true });
      } catch (cacheError) {
        console.warn('🔐 signOut: Cache clearing failed:', cacheError);
        steps.push({ step: 'caches', success: false, error: cacheError.message });
      }
    } else {
      steps.push({ step: 'caches', success: true, skipped: true });
    }
    
    updateProgress(cleanupSteps[currentStep].name, 'completed');

    // Step 5: Redirect
    currentStep = 4;
    updateProgress(cleanupSteps[currentStep].name);
    
    if (debugAuth) console.log('🔐 signOut: Redirecting to:', redirectPath);
    
    if (forceRefresh || !navigate) {
      // Force page refresh for maximum reliability
      window.location.href = redirectPath;
      steps.push({ step: 'redirect', success: true, method: 'refresh' });
    } else {
      // Use React Router navigation
      navigate(redirectPath, { replace: true });
      steps.push({ step: 'redirect', success: true, method: 'navigate' });
    }
    
    updateProgress(cleanupSteps[currentStep].name, 'completed');
    
    if (debugAuth) {
      console.log('🔐 signOut: Process completed successfully');
      console.table(steps);
    }
    
    return { success: true, steps };
    
  } catch (error) {
    console.error('🔐 signOut: Critical error during sign out:', error);
    
    if (onError) {
      onError({
        message: 'Sign out encountered an error but will continue',
        error: error.message,
        steps: steps
      });
    }
    
    // Emergency fallback - force refresh regardless of settings
    try {
      window.location.href = redirectPath;
      return { success: false, error: error.message, steps, fallback: true };
    } catch (fallbackError) {
      console.error('🔐 signOut: Even fallback failed:', fallbackError);
      return { success: false, error: `${error.message} (fallback also failed)`, steps };
    }
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use signOut() instead
 */
export async function signOutAndRedirect(navigate, redirectPath = '/', debug = false) {
  console.warn('signOutAndRedirect is deprecated. Use signOut() instead.');
  return signOut({ navigate, redirectPath, debug });
}

/**
 * Legacy function for backward compatibility  
 * @deprecated Use signOut() with forceRefresh: true instead
 */
export async function signOutAndRefresh(redirectPath = '/', debug = false) {
  console.warn('signOutAndRefresh is deprecated. Use signOut() with forceRefresh: true instead.');
  return signOut({ redirectPath, forceRefresh: true, debug });
}
