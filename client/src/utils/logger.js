// src/utils/logger.js
// Centralized logging utility that respects environment and debug flags

const isProd = process.env.NODE_ENV === 'production';

// Debug flags - can be enabled via localStorage for debugging in production
const getDebugFlags = () => {
  if (typeof window === 'undefined') return {};
  try {
    const flags = localStorage.getItem('debug_flags');
    return flags ? JSON.parse(flags) : {};
  } catch {
    return {};
  }
};

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Current log level - ERROR and WARN always show, others only in dev or with debug flag
const getCurrentLevel = () => {
  if (!isProd) return LOG_LEVELS.DEBUG;
  const flags = getDebugFlags();
  if (flags.verbose) return LOG_LEVELS.TRACE;
  if (flags.debug) return LOG_LEVELS.DEBUG;
  return LOG_LEVELS.WARN;
};

// Categories that can be individually enabled/disabled
const CATEGORIES = {
  AUTH: 'auth',
  API: 'api',
  CACHE: 'cache',
  ODDS: 'odds',
  MARKETS: 'markets',
  PICKS: 'picks',
  UI: 'ui',
  PERF: 'perf'
};

// Check if a category is enabled
const isCategoryEnabled = (category) => {
  if (!isProd) return true; // All categories enabled in dev
  const flags = getDebugFlags();
  if (flags.all) return true;
  return flags[category] === true;
};

// Format log message with timestamp and category
const formatMessage = (category, message) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  return `[${timestamp}] [${category.toUpperCase()}] ${message}`;
};

// Main logger object
const logger = {
  // Error - always logs
  error: (category, message, ...args) => {
    console.error(formatMessage(category, message), ...args);
  },

  // Warn - always logs
  warn: (category, message, ...args) => {
    console.warn(formatMessage(category, message), ...args);
  },

  // Info - logs in dev or when category enabled
  info: (category, message, ...args) => {
    if (getCurrentLevel() >= LOG_LEVELS.INFO && isCategoryEnabled(category)) {
      console.info(formatMessage(category, message), ...args);
    }
  },

  // Debug - logs in dev or when debug flag set
  debug: (category, message, ...args) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG && isCategoryEnabled(category)) {
      console.log(formatMessage(category, message), ...args);
    }
  },

  // Trace - verbose logging, only when explicitly enabled
  trace: (category, message, ...args) => {
    if (getCurrentLevel() >= LOG_LEVELS.TRACE && isCategoryEnabled(category)) {
      console.log(formatMessage(category, message), ...args);
    }
  },

  // Group logging for related operations
  group: (category, label) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG && isCategoryEnabled(category)) {
      console.group(formatMessage(category, label));
    }
  },

  groupEnd: () => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG) {
      console.groupEnd();
    }
  },

  // Performance timing
  time: (label) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG && isCategoryEnabled(CATEGORIES.PERF)) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG && isCategoryEnabled(CATEGORIES.PERF)) {
      console.timeEnd(label);
    }
  },

  // Enable debug mode in production (call from browser console)
  enableDebug: (categories = ['all']) => {
    const flags = { debug: true };
    categories.forEach(cat => { flags[cat] = true; });
    localStorage.setItem('debug_flags', JSON.stringify(flags));
    console.log('🔧 Debug mode enabled for:', categories);
  },

  // Disable debug mode
  disableDebug: () => {
    localStorage.removeItem('debug_flags');
    console.log('🔧 Debug mode disabled');
  },

  // Check current debug status
  status: () => {
    const flags = getDebugFlags();
    console.log('🔧 Debug flags:', flags);
    console.log('🔧 Current level:', getCurrentLevel());
    console.log('🔧 Is production:', isProd);
  }
};

// Export categories for use in other files
export { CATEGORIES };
export default logger;

// Make logger available globally for debugging in browser console
if (typeof window !== 'undefined') {
  window.__logger = logger;
}
