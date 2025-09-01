// Browser compatibility utilities and polyfills

// Detect browser type
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  const isMobile = /Mobi|Android/i.test(userAgent);
  
  return {
    isChrome,
    isSafari,
    isFirefox,
    isEdge,
    isMobile,
    userAgent
  };
};

// CSS custom properties fallback for older browsers
export const setCSSVariable = (property, value, element = document.documentElement) => {
  if (element.style.setProperty) {
    element.style.setProperty(property, value);
  } else {
    // Fallback for older browsers
    element.style[property.replace(/^--/, '')] = value;
  }
};

// Intersection Observer polyfill check
export const hasIntersectionObserver = () => {
  return 'IntersectionObserver' in window;
};

// ResizeObserver polyfill check
export const hasResizeObserver = () => {
  return 'ResizeObserver' in window;
};

// Fetch polyfill for older browsers
export const ensureFetch = () => {
  if (!window.fetch) {
    console.warn('Fetch API not supported, loading polyfill');
    // In a real app, you'd load a polyfill here
    return false;
  }
  return true;
};

// CSS Grid support detection
export const hasGridSupport = () => {
  const testEl = document.createElement('div');
  testEl.style.display = 'grid';
  return testEl.style.display === 'grid';
};

// Flexbox support detection
export const hasFlexboxSupport = () => {
  const testEl = document.createElement('div');
  testEl.style.display = 'flex';
  return testEl.style.display === 'flex';
};

// Safari-specific fixes
export const applySafariFixes = () => {
  const { isSafari } = getBrowserInfo();
  
  if (isSafari) {
    // Fix for Safari's 100vh issue with mobile viewport
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      setCSSVariable('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Fix for Safari's backdrop-filter performance
    document.body.classList.add('safari-browser');
    
    // Fix for Safari's date input styling
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
      input.classList.add('safari-date-input');
    });
  }
};

// Firefox-specific fixes
export const applyFirefoxFixes = () => {
  const { isFirefox } = getBrowserInfo();
  
  if (isFirefox) {
    document.body.classList.add('firefox-browser');
    
    // Fix for Firefox's scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
      .firefox-browser ::-webkit-scrollbar {
        display: none;
      }
      .firefox-browser {
        scrollbar-width: thin;
        scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
      }
    `;
    document.head.appendChild(style);
  }
};

// Edge-specific fixes
export const applyEdgeFixes = () => {
  const { isEdge } = getBrowserInfo();
  
  if (isEdge) {
    document.body.classList.add('edge-browser');
  }
};

// Feature detection and progressive enhancement
export const initBrowserCompat = () => {
  const browserInfo = getBrowserInfo();
  
  // Add browser classes to body
  Object.keys(browserInfo).forEach(key => {
    if (browserInfo[key] === true) {
      document.body.classList.add(key.toLowerCase().replace('is', '') + '-browser');
    }
  });
  
  // Apply browser-specific fixes
  applySafariFixes();
  applyFirefoxFixes();
  applyEdgeFixes();
  
  // Check for required features
  const features = {
    fetch: ensureFetch(),
    grid: hasGridSupport(),
    flexbox: hasFlexboxSupport(),
    intersectionObserver: hasIntersectionObserver(),
    resizeObserver: hasResizeObserver()
  };
  
  // Log missing features in development
  if (process.env.NODE_ENV === 'development') {
    const missingFeatures = Object.keys(features).filter(key => !features[key]);
    if (missingFeatures.length > 0) {
      console.warn('Missing browser features:', missingFeatures);
    }
  }
  
  return { browserInfo, features };
};

// Safe event listener with passive support detection
export const addEventListenerSafe = (element, event, handler, options = {}) => {
  let supportsPassive = false;
  
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
        return false;
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}
  
  const finalOptions = supportsPassive ? options : (options.capture || false);
  element.addEventListener(event, handler, finalOptions);
};

// Smooth scroll polyfill for Safari
export const smoothScrollTo = (element, options = {}) => {
  if ('scrollBehavior' in document.documentElement.style) {
    element.scrollTo(options);
  } else {
    // Polyfill for smooth scrolling
    const startTime = performance.now();
    const startY = element.scrollTop;
    const targetY = options.top || 0;
    const distance = targetY - startY;
    const duration = 300;
    
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeInOutCubic = progress < 0.5
        ? 4 * progress * progress * progress
        : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
      
      element.scrollTop = startY + distance * easeInOutCubic;
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
  }
};

export default {
  getBrowserInfo,
  setCSSVariable,
  initBrowserCompat,
  addEventListenerSafe,
  smoothScrollTo,
  applySafariFixes,
  applyFirefoxFixes,
  applyEdgeFixes
};
