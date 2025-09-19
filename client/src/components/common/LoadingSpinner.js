import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'var(--accent)', 
  text = null,
  fullScreen = false 
}) {
  const sizeClass = `spinner-${size}`;
  const containerClass = fullScreen ? 'loading-spinner-fullscreen' : 'loading-spinner-container';
  
  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClass}`} style={{ borderTopColor: color }}>
        <div className="spinner-inner"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="loading-card">
      <div className="loading-card-header">
        <div className="loading-skeleton loading-skeleton-title"></div>
        <div className="loading-skeleton loading-skeleton-subtitle"></div>
      </div>
      <div className="loading-card-content">
        <div className="loading-skeleton loading-skeleton-line"></div>
        <div className="loading-skeleton loading-skeleton-line short"></div>
        <div className="loading-skeleton loading-skeleton-line"></div>
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5, columns = 4 }) {
  return (
    <div className="loading-table">
      <div className="loading-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="loading-skeleton loading-skeleton-header"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="loading-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="loading-skeleton loading-skeleton-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
