import React from 'react';
import { Eye, Type, Keyboard, Volume2, Settings } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import './AccessibilitySettings.css';

export default function AccessibilitySettings() {
  const { 
    highContrast, 
    setHighContrast, 
    fontSize, 
    setFontSize, 
    reducedMotion, 
    setReducedMotion,
    announceToScreenReader 
  } = useAccessibility();

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
    <section className="accessibility-settings-card">
      <div className="card-header">
        <Settings size={20} />
        <h2>Accessibility Settings</h2>
      </div>

      <div className="accessibility-options">
        {/* High Contrast */}
        <div className="option-group">
          <div className="option-header">
            <Eye size={16} />
            <span>Visual</span>
          </div>
          
          <label className="option-item">
            <div className="option-control">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={handleHighContrastToggle}
                aria-describedby="contrast-desc"
              />
              <span className="option-label">High Contrast</span>
            </div>
            <small id="contrast-desc" className="option-description">
              Increases color contrast for better visibility
            </small>
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
            <div className="option-control">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={handleReducedMotionToggle}
                aria-describedby="motion-desc"
              />
              <span className="option-label">Reduce Motion</span>
            </div>
            <small id="motion-desc" className="option-description">
              Minimizes animations and transitions
            </small>
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
    </section>
  );
}
