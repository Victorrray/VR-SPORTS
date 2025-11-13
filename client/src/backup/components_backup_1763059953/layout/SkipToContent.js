import React from 'react';
import { useAccessibility } from './AccessibilityProvider';
import './SkipToContent.css';

export default function SkipToContent() {
  const { skipToContent } = useAccessibility();

  return (
    <button 
      className="skip-to-content"
      onClick={skipToContent}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skipToContent();
        }
      }}
    >
      Skip to main content
    </button>
  );
}
