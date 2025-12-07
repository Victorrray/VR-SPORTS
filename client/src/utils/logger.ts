/**
 * Production-safe logger utility
 * Only logs in development mode to avoid performance issues
 */

const isDev = process.env.NODE_ENV === 'development';

// Set to true to enable verbose logging even in production (for debugging)
const FORCE_VERBOSE = false;

export const logger = {
  // Standard log - only in dev
  log: (...args: any[]) => {
    if (isDev || FORCE_VERBOSE) {
      console.log(...args);
    }
  },
  
  // Warnings - always show
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  
  // Errors - always show
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  // Debug logs - only in dev, for verbose debugging
  debug: (...args: any[]) => {
    if (isDev || FORCE_VERBOSE) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  // Performance-sensitive logs - disabled by default
  perf: (...args: any[]) => {
    if (FORCE_VERBOSE) {
      console.log('[PERF]', ...args);
    }
  }
};

export default logger;
