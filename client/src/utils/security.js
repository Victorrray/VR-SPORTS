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
  
  // Check if this is a cross-origin request
  const isLocalhost = url.startsWith('http://localhost');
  const isSameOrigin = url.startsWith(window.location.origin);
  const isVRSportsAPI = url.includes('vr-sports.onrender.com');
  const isCrossOrigin = !isLocalhost && !isSameOrigin && !isVRSportsAPI;
  
  const secureOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    },
    // Include credentials for same-origin, localhost, and our VR-Sports API
    credentials: isCrossOrigin ? 'omit' : 'include',
  };

  // Add referrer policy for external APIs
  if (url.includes('external') || !url.startsWith(window.location.origin)) {
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
      fetch('/api/csp-report', {
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
