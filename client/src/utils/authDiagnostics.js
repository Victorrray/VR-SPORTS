// Authentication diagnostic utility for desktop issues
import { getBrowserInfo } from './browserCompat';

export const diagnoseAuthIssues = () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    browser: getBrowserInfo(),
    storage: {
      localStorage: testStorage('localStorage'),
      sessionStorage: testStorage('sessionStorage')
    },
    environment: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    },
    auth: {
      hasLocalStorageSession: !!localStorage.getItem('sb-session'),
      hasDemoSession: !!localStorage.getItem('demo-auth-session'),
      hasCSRFToken: !!sessionStorage.getItem('csrf_token')
    }
  };

  // Log diagnostics in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Authentication Diagnostics');
    console.log('Browser:', diagnostics.browser);
    console.log('Storage:', diagnostics.storage);
    console.log('Environment:', diagnostics.environment);
    console.log('Auth State:', diagnostics.auth);
    console.groupEnd();

    // Check for common issues
    const issues = [];

    if (!diagnostics.storage.localStorage) {
      issues.push('localStorage not accessible - authentication may not persist');
    }

    if (!diagnostics.environment.cookieEnabled) {
      issues.push('Cookies disabled - may affect cross-origin requests');
    }

    if (!diagnostics.environment.onLine) {
      issues.push('Offline - cannot authenticate with server');
    }

    if (diagnostics.browser.isSafari && diagnostics.browser.isMobile === false) {
      issues.push('Safari desktop - check private browsing mode');
    }

    if (issues.length > 0) {
      console.warn('⚠️ Potential authentication issues detected:', issues);
    } else {
      console.log('✅ No obvious authentication issues detected');
    }
  }

  return diagnostics;
};

// Storage test utility
const testStorage = (type) => {
  try {
    const storage = type === 'localStorage' ? localStorage : sessionStorage;
    const testKey = `test-${type}-${Date.now()}`;
    storage.setItem(testKey, 'test');
    const value = storage.getItem(testKey);
    storage.removeItem(testKey);
    return value === 'test';
  } catch (error) {
    return false;
  }
};
