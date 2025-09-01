import React from 'react';
import './ScoresLoadingSkeleton.css';

export default function ScoresLoadingSkeleton({ count = 6 }) {
  return (
    <div className="scores-loading-container">
      <div className="scores-skeleton-grid">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="score-skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-status"></div>
              <div className="skeleton-time"></div>
            </div>
            
            <div className="skeleton-teams">
              <div className="skeleton-team-row">
                <div className="skeleton-team-left">
                  <div className="skeleton-logo"></div>
                  <div className="skeleton-team-info">
                    <div className="skeleton-team-name"></div>
                    <div className="skeleton-team-rank"></div>
                  </div>
                </div>
                <div className="skeleton-score"></div>
              </div>
              
              <div className="skeleton-team-row">
                <div className="skeleton-team-left">
                  <div className="skeleton-logo"></div>
                  <div className="skeleton-team-info">
                    <div className="skeleton-team-name"></div>
                    <div className="skeleton-team-rank"></div>
                  </div>
                </div>
                <div className="skeleton-score"></div>
              </div>
            </div>
            
            <div className="skeleton-footer">
              <div className="skeleton-odds-line"></div>
              <div className="skeleton-reactions">
                <div className="skeleton-reaction"></div>
                <div className="skeleton-reaction"></div>
                <div className="skeleton-add-reaction"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
