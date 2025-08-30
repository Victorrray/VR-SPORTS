// src/components/Navbar.js
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const mobileLinks = [
    { label: "Home", to: "/" },
    { label: "Sportsbooks", to: "/sportsbooks" },
    ...(user
      ? [
          { label: "Account", to: "/account" },
          // Sign out will be a button in the drawer footer
        ]
      : [{ label: "Login", to: "/login" }]),
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
        <Link
          to="/"
          className={`${styles.link} ${isActive("/") ? styles.active : ""}`}
        >
          Home
        </Link>
        <Link
          to="/sportsbooks"
          className={`${styles.link} ${
            isActive("/sportsbooks") ? styles.active : ""
          }`}
        >
          Sportsbooks
        </Link>

        {/* RIGHT SIDE AUTH AREA */}
        {!user ? (
          <Link
            to="/login"
            className={`${styles.link} ${isActive("/login") ? styles.active : ""}`}
            style={{ marginLeft: "auto" }}
          >
            Login
          </Link>
        ) : (
          <div className={styles.authArea} style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <Link
              to="/account"
              className={`${styles.link} ${isActive("/account") ? styles.active : ""}`}
            >
              Account
            </Link>
            <button
              onClick={signOut}
              className={styles.link}
              style={{ background: "transparent", border: 0, cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Menu">
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
                className={`${styles.mobileLink} ${
                  isActive(link.to) ? styles.active : ""
                }`}
                onClick={() => setMobileMenu(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {user && (
            <div style={{ padding: 12 }}>
              <button
                onClick={() => {
                  setMobileMenu(false);
                  signOut();
                }}
                className={styles.mobileLink}
                style={{ width: "100%", textAlign: "left" }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
