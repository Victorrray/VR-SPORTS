// src/components/Navbar.js
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const mobileLinks = [
    { label: "Home", to: "/" },
    { label: "Sportsbooks", to: "/sportsbooks" },
  ];

  return (
    <nav className={styles.navbar}>
      <button
        className={styles.hamburger}
        onClick={() => setMobileMenu(true)}
        aria-label="Open Menu"
      >
        <span />
        <span />
        <span />
      </button>

      <div className={styles.navLeft}>
        <Link to="/" className={styles.brandBtn}>
          <span className={styles.brandTitle}>OddsSightSeer</span>
        </Link>
      </div>
      <div className={styles.navLinks}>
        <Link to="/" className={`${styles.link} ${isActive("/") ? styles.active : ""}`}>Home</Link>
        <Link to="/sportsbooks" className={`${styles.link} ${isActive("/sportsbooks") ? styles.active : ""}`}>Sportsbooks</Link>
      </div>

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
            {mobileLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                className={`${styles.mobileLink} ${isActive(link.to) ? styles.active : ""}`}
                onClick={() => setMobileMenu(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
