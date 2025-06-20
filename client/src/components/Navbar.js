// src/components/Navbar.js
import React from "react";
import { useLocation, Link } from "react-router-dom";
import styles from "./Navbar.module.css"; // Make sure to use a CSS module!

export default function Navbar({ showTabs, mode, onModeChange }) {
  const location = useLocation();
  const isMarkets = location.pathname === "/markets";

  return (
    <nav className={styles.navbar}>
      {isMarkets ? (
        <div className={styles.centerWrap}>
          <Link to="/" className={styles.brandBtn}>
            OddsSightSeer
          </Link>
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
        <>
          <div className={styles.navLeft}>
            <Link to="/" className={styles.brandBtn}>
              OddsSightSeer
            </Link>
          </div>
          <div className={styles.navLinks}>
            <Link to="/" className={styles.link}>Home</Link>
            <Link to="/markets" className={styles.link}>Markets</Link>
          </div>
        </>
      )}
    </nav>
  );
}
