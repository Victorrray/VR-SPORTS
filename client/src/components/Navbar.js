import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar({ showTabs, mode, onModeChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Example nav links (customize as needed)
  const links = [
    { label: "Home", to: "/" },
    { label: "Markets", to: "/markets" },
  ];

  // Responsive: Hide/show menu
  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <img src="/logo192.png" alt="logo" className={styles.logo} />
        <span className={styles.brand}>OddsSightSeer</span>
      </div>
      <div className={styles.navLinksDesktop}>
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={
              location.pathname === link.to
                ? `${styles.link} ${styles.active}`
                : styles.link
            }
          >
            {link.label}
          </Link>
        ))}
        {showTabs && (
          <div className={styles.viewToggle}>
            <button
              className={`${styles.vtab} ${mode === "game" ? styles.activeTab : ""}`}
              onClick={() => onModeChange && onModeChange("game")}
            >
              Sports Betting
            </button>
            <button
              className={`${styles.vtab} ${mode === "props" ? styles.activeTab : ""}`}
              onClick={() => onModeChange && onModeChange("props")}
            >
              Player Props
            </button>
          </div>
        )}
      </div>
      {/* Hamburger menu button for mobile */}
      <button
        className={styles.menuButton}
        onClick={() => setMenuOpen(open => !open)}
        aria-label="Toggle menu"
      >
        <span className={styles.hamburger}></span>
      </button>
      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={
                location.pathname === link.to
                  ? `${styles.link} ${styles.active}`
                  : styles.link
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {showTabs && (
            <div className={styles.viewToggleMobile}>
              <button
                className={`${styles.vtab} ${mode === "game" ? styles.activeTab : ""}`}
                onClick={() => {
                  onModeChange && onModeChange("game");
                  setMenuOpen(false);
                }}
              >
                Sports Betting
              </button>
              <button
                className={`${styles.vtab} ${mode === "props" ? styles.activeTab : ""}`}
                onClick={() => {
                  onModeChange && onModeChange("props");
                  setMenuOpen(false);
                }}
              >
                Player Props
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
