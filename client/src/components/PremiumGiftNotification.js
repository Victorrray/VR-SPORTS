import React, { useState } from 'react';
import { X, Gift, Crown } from 'lucide-react';
import './PremiumGiftNotification.css';

const PremiumGiftNotification = ({ expirationDate, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`premium-gift-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`premium-gift-notification ${isVisible ? 'visible' : ''}`}>
        <button 
          className="gift-close-btn"
          onClick={handleClose}
          aria-label="Dismiss notification"
        >
          <X size={20} />
        </button>

        <div className="gift-content">
          <div className="gift-icon-wrapper">
            <div className="gift-icon-bg">
              <Gift size={32} className="gift-icon" />
            </div>
            <div className="sparkles">✨</div>
          </div>

          <h2 className="gift-title">
            <Crown size={24} className="crown-icon" />
            Premium Membership Gifted!
          </h2>

          <p className="gift-message">
            You've been upgraded to <span className="highlight">Platinum status</span> for 1 month, on the house! 
            Enjoy unlimited access to all premium features.
          </p>

          <div className="gift-features">
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>Unlimited API Access</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Advanced Analytics</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Real-time Alerts</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Premium Tools</span>
            </div>
          </div>

          <div className="gift-expiration">
            <span className="expiration-label">Active until:</span>
            <span className="expiration-date">{formatDate(expirationDate)}</span>
          </div>

          <button className="gift-cta-btn" onClick={handleClose}>
            Start Exploring Premium Features
          </button>
        </div>

        <div className="gift-gradient-bar"></div>
      </div>
    </div>
  );
};

export default PremiumGiftNotification;
