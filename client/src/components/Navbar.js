import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar({ showTabs = false, mode, onModeChange }) {
  const nav = useNavigate();
  const path = useLocation().pathname;
  const linkClass = p => path === p ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <header className={styles.navbar}>
      <div className={styles.navLeft} onClick={() => nav("/")}>
        <span className={styles.brand}>VR Odds</span>
      </div>

      {/* Tabs only on /markets page */}
      {showTabs && mode && onModeChange && (
        <div className={styles.viewToggle}>
          <button
            className={mode === "game" ? `${styles.vtab} ${styles.active}` : styles.vtab}
            onClick={() => onModeChange("game")}
          >
            Sports&nbsp;Betting
          </button>
          <button
            className={mode === "props" ? `${styles.vtab} ${styles.active}` : styles.vtab}
            onClick={() => onModeChange("props")}
          >
            Fantasy&nbsp;/&nbsp;Props
          </button>
        </div>
      )}

      <nav className={styles.navLinks}>
        <button className={linkClass("/")} onClick={() => nav("/")}>Home</button>
        <button className={linkClass("/markets")} onClick={() => nav("/markets")}>Markets</button>
      </nav>
    </header>
  );
}
