// Debug instrumentation for routing and auth flow
// Gated by VITE_DEBUG_FLOW environment variable

const DEBUG_FLOW = (() => {
  try {
    return import.meta.env?.VITE_DEBUG_FLOW === '1';
  } catch (e) {
    // Fallback for environments where import.meta.env is not available
    return process.env.REACT_APP_DEBUG_FLOW === '1' || 
           window?.VITE_DEBUG_FLOW === '1' ||
           localStorage.getItem('DEBUG_FLOW') === '1';
  }
})();

export function debugLog(category, message, data = null) {
  if (!DEBUG_FLOW) return;
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `🔍 [${timestamp}] ${category}:`;
  
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export function debugAuthStateChange(event, session) {
  debugLog('AUTH', `State changed: ${event}`, {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email
  });
}

export function debugPricingClick(action, isAuthenticated, intent) {
  debugLog('PRICING', `Button clicked: ${action}`, {
    authenticated: isAuthenticated,
    intent,
    timestamp: Date.now()
  });
}

export function debugRedirectDecision(from, to, reason, data = null) {
  debugLog('REDIRECT', `${from} → ${to} (${reason})`, data);
}

export function debugCheckoutResult(success, url = null, error = null) {
  debugLog('CHECKOUT', success ? 'Created successfully' : 'Failed', {
    url: url ? '***' : null, // Don't log full URL for security
    error: error?.message
  });
}

export function debugIntentPersistence(action, intent, returnTo = null) {
  debugLog('INTENT', `${action}`, {
    intent,
    returnTo,
    timestamp: Date.now()
  });
}

export function debugPlanUpdate(userId, plan, success) {
  debugLog('PLAN', `Update ${success ? 'succeeded' : 'failed'}`, {
    userId: userId ? '***' : null, // Don't log full user ID
    plan,
    success
  });
}

// Helper to check if debug mode is enabled
export function isDebugEnabled() {
  return DEBUG_FLOW;
}

// Helper to add debug info to console for manual inspection
export function debugCurrentState() {
  if (!DEBUG_FLOW) return;
  
  const state = {
    url: window.location.href,
    localStorage: {
      pricingIntent: localStorage.getItem('pricingIntent'),
      userSelectedSportsbooks: localStorage.getItem('userSelectedSportsbooks'),
      debugPricing: localStorage.getItem('DEBUG_PRICING')
    },
    sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
      acc[key] = sessionStorage.getItem(key);
      return acc;
    }, {})
  };
  
  console.log('🔍 [DEBUG] Current app state:', state);
  return state;
}
