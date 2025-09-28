// src/components/layout/SectionMenu.js
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Target, Zap, BarChart3, Activity } from "lucide-react";
import "./SectionMenu.css";

/**
 * Right-aligned section dropdown menu component
 */
export default function SectionMenu({ 
  currentSection = "game", 
  onSectionChange,
  hasPlatinum = true // Temporarily set to true to show all options
}) {
  const [isOpen, setIsOpen] = useState(false);

  const sections = [
    { 
      id: "game", 
      name: "Game Odds", 
      description: "Compare odds across all major sportsbooks",
      icon: BarChart3,
      emoji: "📊"
    },
    { 
      id: "props", 
      name: "Player Props", 
      description: "Explore player props across every book you follow",
      icon: Target,
      emoji: "🎯",
      requiresPlatinum: false
    },
    { 
      id: "arbitrage", 
      name: "Arbitrage", 
      description: "Find profitable arbitrage opportunities (Coming Soon)",
      icon: Zap,
      emoji: "⚡",
      requiresPlatinum: true,
      disabled: true
    },
    { 
      id: "middles", 
      name: "Middles", 
      description: "Find middle betting opportunities between different lines (Coming Soon)",
      icon: Activity,
      emoji: "🎪",
      requiresPlatinum: true,
      disabled: true
    }
  ];

  const currentSectionData = sections.find(s => s.id === currentSection) || sections[0];
  
  const handleSectionChange = (sectionId) => {
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
    setIsOpen(false);
  };

  return (
    <div className="section-menu-container">
      <button
        className="section-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="section-button-content">
          {currentSectionData.icon && <currentSectionData.icon size={20} className="section-icon" />}
          <span className="section-name">{currentSectionData.name}</span>
        </div>
      </button>

      {isOpen && (
        <div className="section-dropdown">
          {sections.map(section => {
            // Skip platinum-required sections if user doesn't have platinum
            if (section.requiresPlatinum && !hasPlatinum) return null;
            
            const isActive = section.id === currentSection;
            const isDisabled = section.disabled;
            
            return (
              <button
                key={section.id}
                className={`section-option ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleSectionChange(section.id)}
                aria-current={isActive}
                disabled={isDisabled}
                style={{
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                <span className="section-option-emoji">{section.emoji}</span>
                <div className="section-option-text">
                  <span className="section-option-name">{section.name}</span>
                  <span className="section-option-description">{section.description}</span>
                </div>
                {isActive && <div className="section-active-indicator" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
