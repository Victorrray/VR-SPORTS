// src/components/layout/MobileBottomBar.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, TrendingUp, BarChart3, User, Filter, Activity } from "lucide-react";
import "./MobileBottomBar.css";

export default function MobileBottomBar({ onFilterClick, active = "sportsbooks", showFilter = true }) {
  const [hasNotifications, setHasNotifications] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  // Simulate live activity counter
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { 
      key: "sportsbooks", 
      label: "Odds", 
      icon: TrendingUp, 
      href: "/sportsbooks",
      badge: null
    },
    { 
      key: "home", 
      label: "Home", 
      icon: Home, 
      href: "/",
      badge: null
    },
    { 
      key: "picks", 
      label: "Picks", 
      icon: BarChart3, 
      href: "/picks",
      badge: null
    },
    // Temporarily removed - will add back later
    // { 
    //   key: "scores", 
    //   label: "Scores", 
    //   icon: Activity, 
    //   href: "/scores",
    //   isLive: true
    // },
    // Removed profile button
    // { 
    //   key: "profile", 
    //   label: "Profile", 
    //   icon: User, 
    //   href: "/account" 
    // },
  ];

  return (
    <>
      <div className="mobile-bottom-bar">
        {/* Filter pill removed - now using the FilterMenu component */}
        <nav className="mobile-nav">
          {tabs.map((t) => {
            const IconComponent = t.icon;
            const isActive = active === t.key;

            return (
              <Link
                key={t.key}
                to={t.href}
                className={`mobile-tab${isActive ? " active" : ""}`}
                onClick={(e) => {
                  if (t.href === "#") e.preventDefault();
                  if (t.key === "picks" && hasNotifications) {
                    setHasNotifications(false);
                  }
                }}
              >
                <div className="tab-icon-container">
                  <IconComponent 
                    size={20} 
                    className={`tab-icon${t.isLive ? " live-icon" : ""}`} 
                  />
                  {t.badge && (
                    <span className={`tab-badge${t.badge === "!" ? " notification-badge" : " count-badge"}`}>
                      {t.badge}
                    </span>
                  )}
                  {t.isLive && <div className="live-indicator" />}
                </div>
                <span className="tab-label">{t.label}</span>
                {isActive && <div className="active-indicator" />}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mobile-bottom-spacer" aria-hidden="true" />
    </>
  );
}
