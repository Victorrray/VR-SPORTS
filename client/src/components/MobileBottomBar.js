// src/components/MobileBottomBar.js
import React from "react";
import "./MobileBottomBar.css";

export default function MobileBottomBar({ onFilterClick, active = "sportsbooks", showFilter = true }) {
  const tabs = [
    { key: "sportsbooks", label: "Sportsbooks", icon: "🏦", href: "/sportsbooks" },
    { key: "picks",       label: "My Picks",     icon: "💖", href: "/picks" },
    { key: "scores",      label: "Scores",       icon: "🧮", href: "/scores" },
    { key: "account",     label: "Profile",      icon: "👤", href: "/account" },
  ];

  return (
    <>
      <div className="mobile-bottom-bar">
        {showFilter && (
          <button
            className="filter-pill"
            type="button"
            onClick={onFilterClick}
            aria-label="Open filters"
          >
            <span className="filter-icon">⚙️</span>
            <span className="filter-text">Filters</span>
          </button>
        )}

        <nav className="mobile-nav">
          {tabs.map((t) => {
            const alignClass =
              t.key === "sportsbooks" ? "align-left"
              : t.key === "picks"     ? "align-center"
              : t.key === "scores"    ? "align-right"
              : "align-profile";

            return (
              <a
                key={t.key}
                className={`mobile-tab ${alignClass}${active === t.key ? " active" : ""}`}
                href={t.href}
                onClick={(e) => {
                  // allow real links; prevent "#" if you ever add one
                  if (t.href === "#") e.preventDefault();
                }}
              >
                <span className="tab-icon" aria-hidden>{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
      <div className="mobile-bottom-spacer" aria-hidden="true" />
    </>
  );
}
