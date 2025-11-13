// src/components/layout/GameOddsSelector.js
import React from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import "./GameOddsSelector.css";

/**
 * Straight Bets selector component positioned on the right side
 */
export default function GameOddsSelector({ onClick, currentValue = "Straight Bets", ev = "3.26%", onSectionChange }) {
  return (
    <div className="game-odds-selector-container">
      <button
        className="game-odds-selector-button"
        type="button"
        onClick={onClick || (() => {})} 
        aria-label="Select odds type"
      >
        <div className="game-odds-selector-content">
          <BarChart3 size={18} className="game-odds-icon" />
          <span className="game-odds-text">{currentValue}</span>
          <ChevronDown size={16} className="game-odds-chevron" />
        </div>
        {ev && <div className="game-odds-ev">{ev}</div>}
      </button>
    </div>
  );
}
