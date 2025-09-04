// Performance optimization utilities

// Debounce function for search inputs and API calls
export function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle function for scroll events and resize handlers
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility for images
export function lazyLoadImage(img, src, placeholder = '/placeholder.png') {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = src;
          image.classList.remove('lazy');
          observer.unobserve(image);
        }
      });
    });
    
    img.src = placeholder;
    img.classList.add('lazy');
    observer.observe(img);
  } else {
    // Fallback for older browsers
    img.src = src;
  }
}

// Memory cleanup for components
export function useCleanup(cleanupFn) {
  const { useEffect } = require('react');
  useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
}

// Bundle size analyzer helper
export function analyzeBundle() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in production build');
    return;
  }
  
  // This would integrate with webpack-bundle-analyzer
  console.log('Run: npm run analyze to see bundle breakdown');
}

// Performance monitoring
export class PerformanceMonitor {
  static marks = new Map();
  
  static mark(name) {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }
  
  static measure(name, startMark, endMark) {
    if ('performance' in window && performance.measure) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
      return measure.duration;
    }
  }
  
  static clearMarks() {
    if ('performance' in window) {
      performance.clearMarks();
      performance.clearMeasures();
    }
    this.marks.clear();
  }
}

// API response caching
export class APICache {
  static cache = new Map();
  static maxAge = 5 * 60 * 1000; // 5 minutes
  
  static set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  static get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  static clear() {
    this.cache.clear();
  }
  
  static size() {
    return this.cache.size;
  }
}
