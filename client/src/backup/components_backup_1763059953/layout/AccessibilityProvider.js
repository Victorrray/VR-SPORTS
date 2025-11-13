import React, { createContext, useContext, useEffect, useState } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  useEffect(() => {
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
    
    setReducedMotion(prefersReducedMotion.matches);
    setHighContrast(prefersHighContrast.matches);

    // Listen for changes
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    const handleContrastChange = (e) => setHighContrast(e.matches);
    
    prefersReducedMotion.addEventListener('change', handleMotionChange);
    prefersHighContrast.addEventListener('change', handleContrastChange);

    // Detect keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      prefersReducedMotion.removeEventListener('change', handleMotionChange);
      prefersHighContrast.removeEventListener('change', handleContrastChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    // Apply accessibility classes to body
    document.body.classList.toggle('high-contrast', highContrast);
    document.body.classList.toggle('reduced-motion', reducedMotion);
    document.body.classList.toggle('large-text', fontSize === 'large');
    document.body.classList.toggle('extra-large-text', fontSize === 'extra-large');
  }, [highContrast, reducedMotion, fontSize]);

  const value = {
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    fontSize,
    setFontSize,
    keyboardNavigation,
    announceToScreenReader: (message) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    },
    skipToContent: () => {
      const mainContent = document.querySelector('main, [role="main"], #main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    },
    trapFocus: (element) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
        if (e.key === 'Escape') {
          element.dispatchEvent(new CustomEvent('closeFocusTrap'));
        }
      };

      element.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        element.removeEventListener('keydown', handleTabKey);
      };
    }
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};
