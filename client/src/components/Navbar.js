// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [q, setQ] = useState("");

  const isActive = (path) => location.pathname === path;

  // Keep search input in sync with URL ?q
  useEffect(() => {
    const isSports = location.pathname.startsWith("/sportsbooks");
    const params = new URLSearchParams(location.search);
    setQ(isSports ? (params.get("q") || "") : "");
  }, [location.pathname, location.search]);

  const mobileLinks = [
    { label: "Home", to: "/" },
    { label: "Sportsbooks", to: "/sportsbooks" },
    ...(user ? [{ label: "Account", to: "/account" }] : [{ label: "Login", to: "/login" }]),
  ];

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    navigate(`/sportsbooks?${params.toString()}`);
  }

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

      {/* Mobile search icon - left side (only on sportsbooks page) */}
      {location.pathname.startsWith("/sportsbooks") && (
        <button className={styles.mobileSearchBtn} aria-label="Search">
          <Search size={20} />
        </button>
      )}

      <div className={styles.navLeft}>
        <Link to="/" className={styles.brandBtn}>
          <span className={styles.brandTitle}>OddsSightSeer</span>
        </Link>
      </div>

      <div className={styles.navLinks}>
        <Link to="/" className={`${styles.link} ${isActive("/") ? styles.active : ""}`}>Home</Link>
        <Link
          to="/sportsbooks"
          className={`${styles.link} ${isActive("/sportsbooks") ? styles.active : ""}`}
        >
          Sportsbooks
        </Link>

        {!user ? (
          <Link
            to="/login"
            className={`${styles.link} ${isActive("/login") ? styles.active : ""}`}
            style={{ marginLeft: "auto" }}
          >
            Login
          </Link>
        ) : (
          <Link
            to="/account"
            className={`${styles.link} ${isActive("/account") ? styles.active : ""}`}
            style={{ marginLeft: "auto" }}
          >
            Account
          </Link>
        )}
      </div>

      {/* Mobile notification bell - top right (only on sportsbooks page) */}
      {location.pathname.startsWith("/sportsbooks") && (
        <button className={styles.mobileNotificationBtn} aria-label="Notifications">
          <Bell size={20} />
          <div className={styles.notificationDot} />
        </button>
      )}

      {/* Inline search bar only on Sportsbooks page (desktop only) */}
      {location.pathname.startsWith("/sportsbooks") && (
        <form className={styles.navSearch} onSubmit={handleSearchSubmit} role="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team / league"
            aria-label="Search odds"
          />
          <button type="submit" aria-label="Search">
            <Search size={16} />
          </button>
        </form>
      )}

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
