// Debug utilities for VR-Odds platform
export const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true',
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  showTimestamps: true,
  showComponent: true,
  showUserId: true,
};

export const DebugLogger = {
  debug: (component, message, data = null) => {
    if (!DEBUG_CONFIG.enabled || DEBUG_CONFIG.logLevel === 'error' || DEBUG_CONFIG.logLevel === 'warn') return;
    log('DEBUG', component, message, data);
  },

  info: (component, message, data = null) => {
    if (!DEBUG_CONFIG.enabled || DEBUG_CONFIG.logLevel === 'error') return;
    log('INFO', component, message, data);
  },

  warn: (component, message, data = null) => {
    if (!DEBUG_CONFIG.enabled && DEBUG_CONFIG.logLevel !== 'warn' && DEBUG_CONFIG.logLevel !== 'error') return;
    log('WARN', component, message, data);
  },

  error: (component, message, data = null) => {
    log('ERROR', component, message, data);
  },

  api: (endpoint, method, status, duration, data = null) => {
    if (!DEBUG_CONFIG.enabled) return;
    const emoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
    const message = `${emoji} API ${method} ${endpoint} - ${status} (${duration}ms)`;
    log('API', 'API_CALL', message, data);
  }
};

function log(level, component, message, data) {
  const timestamp = DEBUG_CONFIG.showTimestamps ? `[${new Date().toISOString()}]` : '';
  const componentName = DEBUG_CONFIG.showComponent ? `[${component}]` : '';
  const logData = data ? `\n${JSON.stringify(data, null, 2)}` : '';

  const fullMessage = `${timestamp} ${level} ${componentName} ${message} ${logData}`;

  switch (level) {
    case 'ERROR':
      console.error(fullMessage);
      break;
    case 'WARN':
      console.warn(fullMessage);
      break;
    case 'DEBUG':
      console.debug(fullMessage);
      break;
    default:
      console.log(fullMessage);
  }
}

// Performance monitoring
export const PerformanceMonitor = {
  start: (label) => {
    if (!DEBUG_CONFIG.enabled) return null;
    return {
      label,
      startTime: performance.now(),
      end: function() {
        const duration = performance.now() - this.startTime;
        DebugLogger.debug('PERF', `${this.label} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};

// API Error tracking
export const APIErrorTracker = {
  errors: new Map(),

  track: (endpoint, error, context = {}) => {
    const key = `${endpoint}-${error.message}`;
    const existing = this.errors.get(key) || { count: 0, firstSeen: new Date(), lastSeen: new Date(), context };

    this.errors.set(key, {
      ...existing,
      count: existing.count + 1,
      lastSeen: new Date(),
      context: { ...existing.context, ...context }
    });

    DebugLogger.error('API_TRACKER', `API Error: ${key}`, {
      error: error.message,
      count: existing.count + 1,
      context
    });
  },

  getSummary: () => {
    const summary = Array.from(APIErrorTracker.errors.entries()).map(([key, data]) => ({
      key,
      ...data
    }));
    return summary;
  }
};

// User action tracking
export const UserActionTracker = {
  actions: [],

  track: (action, data = {}) => {
    if (!DEBUG_CONFIG.enabled) return;

    const actionData = {
      action,
      timestamp: new Date().toISOString(),
      userId: DEBUG_CONFIG.showUserId ? (data.userId || 'unknown') : undefined,
      ...data
    };

    UserActionTracker.actions.push(actionData);

    // Keep only last 100 actions
    if (UserActionTracker.actions.length > 100) {
      UserActionTracker.actions.shift();
    }

    DebugLogger.debug('USER_ACTION', action, actionData);
  }
};

// Export debug helpers for components
export const useDebugLogger = (component) => {
  return {
    debug: (message, data) => DebugLogger.debug(component, message, data),
    info: (message, data) => DebugLogger.info(component, message, data),
    warn: (message, data) => DebugLogger.warn(component, message, data),
    error: (message, data) => DebugLogger.error(component, message, data),
    api: (endpoint, method, status, duration, data) => DebugLogger.api(endpoint, method, status, duration, data)
  };
};

// Network connectivity monitor
export const NetworkMonitor = {
  isOnline: navigator.onLine,
  listeners: [],

  init: () => {
    window.addEventListener('online', () => {
      NetworkMonitor.isOnline = true;
      DebugLogger.info('NETWORK', 'Connection restored');
      NetworkMonitor.listeners.forEach(callback => callback(true));
    });

    window.addEventListener('offline', () => {
      NetworkMonitor.isOnline = false;
      DebugLogger.warn('NETWORK', 'Connection lost');
      NetworkMonitor.listeners.forEach(callback => callback(false));
    });
  },

  onStatusChange: (callback) => {
    NetworkMonitor.listeners.push(callback);
    return () => {
      const index = NetworkMonitor.listeners.indexOf(callback);
      if (index > -1) NetworkMonitor.listeners.splice(index, 1);
    };
  }
};

// Initialize network monitoring
NetworkMonitor.init();

// Export everything
export default {
  DebugLogger,
  PerformanceMonitor,
  APIErrorTracker,
  UserActionTracker,
  useDebugLogger,
  NetworkMonitor,
  DEBUG_CONFIG
};
