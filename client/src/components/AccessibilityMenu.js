import React, { useState } from 'react';
import { Settings, Eye, Type, Keyboard, Volume2 } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import './AccessibilityMenu.css';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    highContrast, 
    setHighContrast, 
    fontSize, 
    setFontSize, 
    reducedMotion, 
    setReducedMotion,
    announceToScreenReader 
  } = useAccessibility();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      announceToScreenReader('Accessibility menu opened');
    }
  };

  const handleHighContrastToggle = () => {
    setHighContrast(!highContrast);
    announceToScreenReader(`High contrast ${!highContrast ? 'enabled' : 'disabled'}`);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const handleReducedMotionToggle = () => {
    setReducedMotion(!reducedMotion);
    announceToScreenReader(`Reduced motion ${!reducedMotion ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="accessibility-menu">
      <button
        className="accessibility-toggle"
        onClick={handleToggle}
        aria-label="Open accessibility options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div 
          className="accessibility-panel"
          role="dialog"
          aria-label="Accessibility Settings"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              announceToScreenReader('Accessibility menu closed');
            }
          }}
        >
          <div className="accessibility-header">
            <h3>Accessibility Settings</h3>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility menu"
            >
              ×
            </button>
          </div>

          <div className="accessibility-options">
            {/* High Contrast */}
            <div className="option-group">
              <div className="option-header">
                <Eye size={16} />
                <span>Visual</span>
              </div>
              
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={handleHighContrastToggle}
                  aria-describedby="contrast-desc"
                />
                <span>High Contrast</span>
                <small id="contrast-desc">Increases color contrast for better visibility</small>
              </label>
            </div>

            {/* Font Size */}
            <div className="option-group">
              <div className="option-header">
                <Type size={16} />
                <span>Text Size</span>
              </div>
              
              <div className="font-size-options" role="radiogroup" aria-label="Font size options">
                {['normal', 'large', 'extra-large'].map((size) => (
                  <label key={size} className="font-size-option">
                    <input
                      type="radio"
                      name="fontSize"
                      value={size}
                      checked={fontSize === size}
                      onChange={() => handleFontSizeChange(size)}
                    />
                    <span className={`font-preview font-${size}`}>
                      {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Motion */}
            <div className="option-group">
              <div className="option-header">
                <Keyboard size={16} />
                <span>Motion</span>
              </div>
              
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={handleReducedMotionToggle}
                  aria-describedby="motion-desc"
                />
                <span>Reduce Motion</span>
                <small id="motion-desc">Minimizes animations and transitions</small>
              </label>
            </div>

            {/* Keyboard Navigation Info */}
            <div className="option-group">
              <div className="option-header">
                <Volume2 size={16} />
                <span>Keyboard Navigation</span>
              </div>
              <div className="keyboard-info">
                <p>Use Tab to navigate, Enter/Space to activate, Escape to close dialogs.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
