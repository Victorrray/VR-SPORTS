// src/components/Navbar.js
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import styles from "./Navbar.module.css";
import logo from "../assets/logo.png"; // Update path to your logo file

export default function Navbar({ showTabs, mode, onModeChange }) {
  const location = useLocation();
  const isMarkets = location.pathname === "/markets";
  const [mobileMenu, setMobileMenu] = useState(false);

  // Links for mobile overlay menu
  const mobileLinks = isMarkets
    ? [
        {
          label: "Sports Betting",
          onClick: () => {
            if (onModeChange) onModeChange("game");
            setMobileMenu(false);
          },
          active: mode === "game",
        },
        {
          label: "Player Props",
          onClick: () => {
            if (onModeChange) onModeChange("props");
            setMobileMenu(false);
          },
          active: mode === "props",
        },
      ]
    : [
        {
          label: "Home",
          to: "/",
        },
        {
          label: "Markets",
          to: "/markets",
        },
      ];

  return (
    <nav className={styles.navbar}>
      {/* --- Hamburger icon for mobile --- */}
      <button
        className={styles.hamburger}
        onClick={() => setMobileMenu(true)}
        aria-label="Open Menu"
      >
        <span />
        <span />
        <span />
      </button>

      {isMarkets ? (
        <div className={styles.centerWrap}>
          <Link to="/" className={styles.brandBtn}>
            <img src={logo} alt="logo" className={styles.logo} />
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
              <img src={logo} alt="logo" className={styles.logo} />
              OddsSightSeer
            </Link>
          </div>
          <div className={styles.navLinks}>
            <Link to="/" className={styles.link}>Home</Link>
            <Link to="/markets" className={styles.link}>Markets</Link>
          </div>
        </>
      )}

      {/* --- MOBILE OVERLAY MENU --- */}
      {mobileMenu && (
        <div className={styles.mobileMenu}>
          <button
            className={styles.closeBtn}
            onClick={() => setMobileMenu(false)}
            aria-label="Close Menu"
          >
            ×
          </button>
          <div className={styles.mobileLinks}>
            {mobileLinks.map((link, idx) =>
              link.to ? (
                <Link
                  key={idx}
                  to={link.to}
                  className={styles.mobileLink}
                  onClick={() => setMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={idx}
                  className={`${styles.mobileLink} ${link.active ? styles.active : ""}`}
                  onClick={link.onClick}
                >
                  {link.label}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
