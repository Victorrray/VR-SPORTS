import React from "react";
import "./MobileBottomBar.css";

export default function MobileBottomBar({ onFilterClick, active = "sportsbooks" }) {
  // Show only three tabs (no Player Props)
  const tabs = [
    { key: "sportsbooks", label: "Sportsbooks", icon: "🏦", href: "/sportsbooks" },
    { key: "picks", label: "My Picks", icon: "💖", href: "#" },
    { key: "articles", label: "Articles", icon: "📰", href: "#" },
  ];

  return (
    <>
      <div className="mobile-bottom-bar">
        <button className="filter-pill" type="button" onClick={onFilterClick} aria-label="Open filters">
          <span className="filter-icon">⚙️</span>
          <span className="filter-text">Filters</span>
        </button>
        <nav className="mobile-nav">
          {tabs.map(t => {
            const alignClass = t.key === 'sportsbooks' ? 'align-left' : (t.key === 'picks' ? 'align-center' : 'align-right');
            return (
            <a
              key={t.key}
              className={`mobile-tab ${alignClass}${active === t.key ? " active" : ""}`}
              href={t.href}
              onClick={(e) => { if (t.href === "#") e.preventDefault(); }}
            >
              <span className="tab-icon" aria-hidden>{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </a>
          )})}
        </nav>
      </div>
      <div className="mobile-bottom-spacer" aria-hidden="true" />
    </>
  );
}
