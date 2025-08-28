import React from "react";
import "./ViewTabs.css";          // local styles for the tab strip

export default function ViewTabs({ mode, onChange }) {
  const tabs = [
    { id: "game",  label: "SPORTS BETTING" },   // ML / Spreads / Totals / Alt
    { id: "props", label: "FANTASY / PROPS" }   // strictly player props
  ];

  return (
    <nav className="view-tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={mode === t.id ? "tab active" : "tab"}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
