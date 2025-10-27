// Security utilities for API protection and CSRF prevention

// Generate CSRF token
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Store CSRF token in sessionStorage
export const setCSRFToken = () => {
  const token = generateCSRFToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
};

// Get CSRF token from sessionStorage
export const getCSRFToken = () => {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = setCSRFToken();
  }
  return token;
};

// Enhanced fetch wrapper with security headers
export const secureFetch = async (url, options = {}) => {
  const csrfToken = getCSRFToken();

  // Handle API URL for both development and production
  const isProduction = process.env.NODE_ENV === 'production';
  const isBackendHost = (u) => u.includes('odds-backend-4e9q.onrender.com') || u.includes('vr-sports.onrender.com');
  const isApiPath = (u) => u.startsWith('/api/');

  // In development, don't proxy localhost URLs - they're already correct
  // Only proxy production backend URLs if accidentally used in development
  if (!isProduction && isBackendHost(url) && url.startsWith('http')) {
    const proxyUrl = new URL(url);
    url = `${proxyUrl.pathname}${proxyUrl.search}`;
  }

  // Same-origin vs cross-origin
  const isRelative = url.startsWith('/');
  const sameOrigin = isRelative || url.startsWith(window.location.origin);
  const backendAPI = isBackendHost(url) || isApiPath(url);
  const method = (options.method || 'GET').toUpperCase();

  // Build headers conservatively for cross-origin GETs
  const headers = { ...(options.headers || {}) };
  if (backendAPI) {
    try {
      const { getAccessToken, supabase } = require('../lib/supabase');
      const cached = getAccessToken?.();

      // Always attempt to resolve the current session so we can attach the user id
      let session = null;
      try {
        const result = await supabase?.auth?.getSession?.();
        session = result?.data?.session;
      } catch (e) {
        console.error('Error getting session:', e);
      }

      const accessToken = session?.access_token || cached;
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔐 secureFetch: Added Authorization header');
      } else {
        console.warn('⚠️ secureFetch: No access token available');
      }

      if (session?.user?.id) {
        headers['x-user-id'] = session.user.id;
        console.log('🔐 secureFetch: Added x-user-id header:', session.user.id);
      }

      // Fallback: check stored session snapshots for user id (custom persistence)
      if (!headers['x-user-id']) {
        try {
          const storedSession = localStorage.getItem('sb-session');
          if (storedSession) {
            const parsed = JSON.parse(storedSession);
            const storedId = parsed?.user?.id;
            if (storedId) {
              headers['x-user-id'] = storedId;
              console.log('🔐 secureFetch: Added x-user-id from localStorage:', storedId);
            }
          }
        } catch (_) {}
      }

      // Final fallback: demo session support when Supabase disabled
      if (!headers['x-user-id']) {
        try {
          const demoSession = localStorage.getItem('demo-auth-session');
          if (demoSession) {
            const sessionData = JSON.parse(demoSession);
            if (sessionData.id) {
              headers['x-user-id'] = sessionData.id;
              console.log('🔐 secureFetch: Added x-user-id from demo session:', sessionData.id);
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.error('❌ secureFetch: Error setting up auth headers:', e);
    }
  }

  // Only attach CSRF and X-Requested-With for same-origin requests
  if (sameOrigin) {
    headers['X-CSRF-Token'] = csrfToken;
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  // Avoid Content-Type on GET/HEAD to prevent preflight
  if (method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const secureOptions = {
    ...options,
    headers,
    credentials: backendAPI || !isProduction ? 'include' : (sameOrigin ? 'include' : 'omit'),
  };

  // Add referrer policy for external APIs
  if (!sameOrigin) {
    secureOptions.referrerPolicy = 'no-referrer';
  }

  try {
    const response = await fetch(url, secureOptions);
    
    // Check for security-related errors
    if (response.status === 403) {
      throw new Error('CSRF token validation failed');
    }
    
    return response;
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate URL to prevent open redirects
export const isValidRedirectURL = (url) => {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Only allow same-origin redirects
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
};

// Rate limiting for API calls
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old requests
    if (this.requests.has(key)) {
      this.requests.set(key, this.requests.get(key).filter(time => time > windowStart));
    } else {
      this.requests.set(key, []);
    }
    
    const requestCount = this.requests.get(key).length;
    
    if (requestCount >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    this.requests.get(key).push(now);
    return true;
  }

  getRemainingRequests(key = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) return this.maxRequests;
    
    const recentRequests = this.requests.get(key).filter(time => time > windowStart);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const apiRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute

// Content Security Policy helpers
export const CSPUtils = {
  // Check if inline scripts are allowed (for development)
  allowsInlineScripts: () => {
    try {
      // This will throw if CSP blocks inline scripts
      new Function('return true')();
      return true;
    } catch {
      return false;
    }
  },

  // Report CSP violations (in production, send to logging service)
  reportViolation: (violation) => {
    console.warn('CSP Violation:', violation);
    
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to security monitoring service
      const { withApiBase } = require('../config/api');
      fetch(withApiBase('/api/csp-report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation)
      }).catch(() => {}); // Fail silently
    }
  }
};

export default {
  generateCSRFToken,
  setCSRFToken,
  getCSRFToken,
  secureFetch,
  sanitizeInput,
  isValidRedirectURL,
  apiRateLimiter,
  CSPUtils
};
