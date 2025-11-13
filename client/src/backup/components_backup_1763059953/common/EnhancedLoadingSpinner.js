// src/components/common/EnhancedLoadingSpinner.js
import React from 'react';
import './EnhancedLoadingSpinner.css';

/**
 * Enhanced loading spinner component with improved visibility and animations
 */
const EnhancedLoadingSpinner = ({ 
  message = "Loading...", 
  subMessage = null,
  size = "medium",
  fullScreen = false,
  type = "default"
}) => {
  return (
    <div className={`enhanced-loading ${fullScreen ? 'fullscreen' : ''} ${type}`}>
      <div className="spinner-container">
        <div className={`spinner ${size}`}></div>
        <div className="spinner-pulse"></div>
      </div>
      
      <div className="spinner-text">
        <h3>{message}</h3>
        {subMessage && <p>{subMessage}</p>}
      </div>
    </div>
  );
};

export default EnhancedLoadingSpinner;
