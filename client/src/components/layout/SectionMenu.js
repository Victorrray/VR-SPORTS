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
  hasPlatinum = false,
  hasGoldOrBetter = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  const sections = [
    { 
      id: "game", 
      name: "Straight Bets", 
      description: "Compare odds across all major sportsbooks",
      icon: BarChart3,
      emoji: "📊",
      free: true
    },
    { 
      id: "props", 
      name: "Player Props", 
      description: "Explore player props across every book you follow",
      icon: Target,
      emoji: "🎯",
      requiresGold: true
    },
    { 
      id: "arbitrage", 
      name: "Arbitrage", 
      description: "Find profitable arbitrage opportunities",
      icon: Zap,
      emoji: "⚡",
      requiresPlatinum: true
    },
    { 
      id: "middles", 
      name: "Middles", 
      description: "Find middle betting opportunities between different lines",
      icon: Activity,
      emoji: "🎪",
      requiresPlatinum: true
    }
  ];

  const currentSectionData = sections.find(s => s.id === currentSection) || sections[0];
  
  const handleSectionChange = (sectionId) => {
    console.log(`📍 SectionMenu: Changing to ${sectionId}`);
    setIsOpen(false); // Close dropdown first
    if (onSectionChange) {
      // Use setTimeout to ensure dropdown closes before navigation
      setTimeout(() => {
        onSectionChange(sectionId);
      }, 0);
    }
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
            const isActive = section.id === currentSection;
            const isPlatinumRequired = section.requiresPlatinum && !hasPlatinum;
            const isGoldRequired = section.requiresGold && !hasGoldOrBetter;
            const isDisabled = section.disabled || isPlatinumRequired || isGoldRequired;
            
            return (
              <button
                key={section.id}
                className={`section-option ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleSectionChange(section.id)}
                aria-current={isActive}
                disabled={isDisabled}
                title={isPlatinumRequired ? 'Requires Platinum Plan' : isGoldRequired ? 'Requires Gold Plan' : ''}
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
