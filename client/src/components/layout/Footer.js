import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export default function Footer({ className }) {
  const year = new Date().getFullYear();
  return (
    <footer className={`${styles.footer} ${className || ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandTitle}>OddSightSeer</span>
        </Link>

        <nav className={styles.links} aria-label="Footer">
          <Link to="/" className={styles.link}>Home</Link>
          <Link to="/sportsbooks" className={styles.link}>Sportsbooks</Link>
          {/* Future: <Link to="/about" className={styles.link}>About</Link> */}
          {/* Future: <Link to="/contact" className={styles.link}>Contact</Link> */}
        </nav>

        <div className={styles.meta}>
          © {year} OddSightSeer. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
