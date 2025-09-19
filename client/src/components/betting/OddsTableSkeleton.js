import React from 'react';
import './OddsTableSkeleton.css';

export default function OddsTableSkeleton({ rows = 8 }) {
  return (
    <div className="odds-table-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-header-cell skeleton-ev"></div>
        <div className="skeleton-header-cell skeleton-game"></div>
        <div className="skeleton-header-cell skeleton-market"></div>
        <div className="skeleton-header-cell skeleton-books"></div>
      </div>
      
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton-cell skeleton-ev-cell">
            <div className="skeleton-ev-pill"></div>
            <div className="skeleton-add-btn"></div>
          </div>
          
          <div className="skeleton-cell skeleton-game-cell">
            <div className="skeleton-game-time"></div>
            <div className="skeleton-teams">
              <div className="skeleton-team-name"></div>
              <div className="skeleton-vs">@</div>
              <div className="skeleton-team-name"></div>
            </div>
            <div className="skeleton-league"></div>
          </div>
          
          <div className="skeleton-cell skeleton-market-cell">
            <div className="skeleton-market-name"></div>
            <div className="skeleton-selection"></div>
          </div>
          
          <div className="skeleton-cell skeleton-books-cell">
            <div className="skeleton-books-grid">
              {Array.from({ length: 4 }).map((_, bookIndex) => (
                <div key={bookIndex} className="skeleton-book">
                  <div className="skeleton-book-logo"></div>
                  <div className="skeleton-odds"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Mobile version
export function OddsTableSkeletonMobile({ rows = 6 }) {
  return (
    <div className="odds-table-skeleton-mobile">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-mobile-card">
          <div className="skeleton-mobile-header">
            <div className="skeleton-mobile-time"></div>
            <div className="skeleton-mobile-ev">
              <div className="skeleton-ev-pill-mobile"></div>
              <div className="skeleton-add-btn-mobile"></div>
            </div>
          </div>
          
          <div className="skeleton-mobile-teams">
            <div className="skeleton-team-name-mobile"></div>
            <div className="skeleton-vs-mobile">@</div>
            <div className="skeleton-team-name-mobile"></div>
          </div>
          
          <div className="skeleton-mobile-market">
            <div className="skeleton-market-name-mobile"></div>
            <div className="skeleton-selection-mobile"></div>
          </div>
          
          <div className="skeleton-mobile-books">
            {Array.from({ length: 3 }).map((_, bookIndex) => (
              <div key={bookIndex} className="skeleton-mobile-book">
                <div className="skeleton-book-logo-mobile"></div>
                <div className="skeleton-odds-mobile"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
