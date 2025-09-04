// Bundle optimization utilities
import React from 'react';

// Code splitting helper for dynamic imports
export const lazyLoad = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props) => (
    <React.Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Tree shaking helper - only import what you need
export const selectiveImport = (module, keys) => {
  const selected = {};
  keys.forEach(key => {
    if (module[key]) {
      selected[key] = module[key];
    }
  });
  return selected;
};

// Preload critical resources
export const preloadResource = (href, as = 'script', crossorigin = null) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = crossorigin;
  document.head.appendChild(link);
};

// Prefetch non-critical resources
export const prefetchResource = (href) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

// Critical CSS inlining helper
export const inlineCriticalCSS = (css) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

// Remove unused CSS classes (basic implementation)
export const purgeUnusedCSS = (usedClasses) => {
  const styleSheets = Array.from(document.styleSheets);
  
  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules);
      rules.forEach((rule, index) => {
        if (rule.type === CSSRule.STYLE_RULE) {
          const selector = rule.selectorText;
          const isUsed = usedClasses.some(className => 
            selector.includes(`.${className}`)
          );
          
          if (!isUsed) {
            sheet.deleteRule(index);
          }
        }
      });
    } catch (e) {
      // Cross-origin stylesheets can't be accessed
      console.warn('Cannot access stylesheet:', e);
    }
  });
};

// Bundle size analysis helper
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis: Run "npm run build" and "npm run analyze" to see bundle breakdown');
    console.log('Install webpack-bundle-analyzer for detailed analysis: npm install --save-dev webpack-bundle-analyzer');
  }
};

// Service worker registration for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Resource hints for better loading
export const addResourceHints = () => {
  // DNS prefetch for external domains
  const dnsPrefetch = [
    'https://api.the-odds-api.com',
    'https://fonts.googleapis.com',
    'https://cdnjs.cloudflare.com'
  ];
  
  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
  
  // Preconnect to critical origins
  const preconnect = [
    'https://api.the-odds-api.com'
  ];
  
  preconnect.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};
