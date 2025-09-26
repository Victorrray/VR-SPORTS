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
    { id: 'arbitrage', name: 'Arbitrage', icon: Zap, requiresPlatinum: true },
    { id: 'middles', name: 'Middles', icon: Activity, requiresPlatinum: true }
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
          // Skip platinum-required sections if user doesn't have platinum
          if (section.requiresPlatinum && !hasPlatinum) return null;
          
          const IconComponent = section.icon;
          const isActive = currentSection === section.id;
          
          return (
            <button
              key={section.id}
              className={`desktop-section-option ${isActive ? 'active' : ''}`}
              onClick={() => onSectionChange(section.id)}
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
