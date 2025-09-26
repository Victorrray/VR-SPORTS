// src/components/layout/FilterMenu.js
import React from "react";
import { Filter } from "lucide-react";
import "./FilterMenu.css";

/**
 * Left-aligned filter button and menu component
 */
export default function FilterMenu({ onClick, isOpen }) {
  return (
    <div className="filter-menu-container">
      <button
        className="filter-button"
        type="button"
        onClick={onClick}
        aria-label="Open filters"
        aria-expanded={isOpen}
      >
        <Filter size={20} className="filter-icon" />
        <span className="filter-text">Filters</span>
      </button>
    </div>
  );
}
