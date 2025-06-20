// src/components/Navbar.js
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import styles from "./Navbar.module.css"; // Use your CSS module!

export default function Navbar({ showTabs, mode, onModeChange }) {
  const location = useLocation();
  const isMarkets = location.pathname === "/markets";
  const [mobileOpen, setMobileOpen] = useState(false); // for hamburger, future use

  return (
    <nav className={styles.navbar}>
      {/* Left: Logo + Brand, always */}
      <div className={styles.navLeft}>
        <Link to="/" className={styles.brandBtn} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src="/logo192.png"
            alt="OddsSightSeer Logo"
            className={styles.logo}
            style={{ width: 32, height: 32, marginRight: 10, verticalAlign: "middle" }}
          />
          <span className={styles.brand}>OddsSightSeer</span>
        </Link>
      </div>

      {/* Hamburger for mobile */}
      <button
        className={styles.hamburger}
        aria-label="Open menu"
        onClick={() => setMobileOpen((v) => !v)}
        style={{ marginLeft: "auto", display: "none" }}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Center: Only on Markets page */}
      {isMarkets ? (
        <div className={styles.centerWrap}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.vtab} ${mode === "game" ? styles.active : ""}`}
              onClick={() => onModeChange && onModeChange("game")}
            >
              Sports Betting
            </button>
            <button
              className={`${styles.vtab} ${mode === "props" ? styles.active : ""}`}
              onClick={() => onModeChange && onModeChange("props")}
            >
              Player Props
            </button>
          </div>
        </div>
      ) : (
        // Right links: Home/Markets (not on Markets page)
        <div className={styles.navLinks}>
          <Link to="/" className={styles.link}>Home</Link>
          <Link to="/markets" className={styles.link}>Markets</Link>
        </div>
      )}
    </nav>
  );
}
