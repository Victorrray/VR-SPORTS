// src/components/layout/DesktopHeader.js
import React from 'react';
import { Filter, BarChart3, Target, Zap, Activity } from 'lucide-react';
import './DesktopHeader.css';

/**
 * Desktop header component for the odds page
 */
export default function DesktopHeader({ 
  onFilterClick, 
  currentSection = 'game',
  onSectionChange,
  hasPlatinum = false
}) {
  // Section options
  const sections = [
    { id: 'game', name: 'Game Odds', icon: BarChart3 },
    { id: 'props', name: 'Player Props', icon: Target },
    { id: 'arbitrage', name: 'Arbitrage', icon: Zap, disabled: true },
    { id: 'middles', name: 'Middles', icon: Activity, disabled: true }
  ];

  return (
    <div className="desktop-header">
      <div className="desktop-filters">
        <button className="desktop-filter-button" onClick={onFilterClick}>
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      <div className="desktop-section-selector">
        {sections.map(section => {
          const IconComponent = section.icon;
          const isActive = currentSection === section.id;
          const isDisabled = section.disabled || (section.requiresPlatinum && !hasPlatinum);
          
          return (
            <button
              key={section.id}
              className={`desktop-section-option ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && onSectionChange(section.id)}
              disabled={isDisabled}
              title={isDisabled ? (section.disabled ? 'Coming Soon' : 'Requires Platinum Plan') : ''}
            >
              <IconComponent size={16} className="section-icon" />
              <span>{section.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
