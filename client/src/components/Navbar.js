// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Search, User, ChevronDown, CreditCard, Settings, Menu } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMe } from "../hooks/useMe";
import styles from "./Navbar.module.css";

export default function Navbar({ onOpenMobileSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const { me } = useMe();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
    { label: "Odds", to: "/sportsbooks" },
    { label: "Picks", to: "/picks" },
    { label: "Scores", to: "/scores" },
    ...(user ? [{ label: "Profile", to: "/account" }] : [{ label: "Login", to: "/login" }]),
  ];

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    navigate(`/sportsbooks?${params.toString()}`);
  }

  function handleMobileSearch(searchTerm) {
    const params = new URLSearchParams(location.search);
    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");
    navigate(`/sportsbooks?${params.toString()}`);
  }

  const { withApiBase } = require('../config/api');
  const handleUpgrade = async () => {
    try {
      const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Unable to start checkout. Please try again.');
    }
  };

  const handleManageBilling = () => {
    // TODO: Implement customer portal link
    alert('Billing management coming soon!');
  };

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
        <button 
          className={styles.mobileSearchBtn} 
          aria-label="Search"
          onClick={() => {
            // Directly dispatch custom event to trigger modal
            window.dispatchEvent(new CustomEvent('openMobileSearch'));
          }}
        >
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
          Odds
        </Link>
        {user && (
          <Link
            to="/picks"
            className={`${styles.link} ${isActive("/picks") ? styles.active : ""}`}
          >
            Picks
          </Link>
        )}
        {user && (
          <Link
            to="/scores"
            className={`${styles.link} ${isActive("/scores") ? styles.active : ""}`}
          >
            Scores
          </Link>
        )}

        {!user ? (
          <Link
            to="/login"
            className={`${styles.link} ${isActive("/login") ? styles.active : ""}`}
            style={{ marginLeft: "auto" }}
          >
            Login
          </Link>
        ) : (
          <div className={styles.userMenu} style={{ marginLeft: "auto" }}>
            <button 
              className={styles.userMenuButton}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
            >
              <User size={16} />
              <span>Account</span>
              <ChevronDown size={14} />
            </button>
            
            {userMenuOpen && (
              <div className={styles.userMenuDropdown}>
                <Link 
                  to="/account" 
                  className={styles.userMenuItem}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings size={16} />
                  Profile Settings
                </Link>
                
                {me?.plan === 'platinum' ? (
                  <button 
                    className={styles.userMenuItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleManageBilling();
                    }}
                  >
                    <CreditCard size={16} />
                    Manage Billing
                  </button>
                ) : (
                  <button 
                    className={styles.userMenuItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleUpgrade();
                    }}
                  >
                    <CreditCard size={16} />
                    Upgrade to Platinum
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile profile button - top right (all pages) */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Profile hamburger menu - only on profile page */}
        {location.pathname === "/account" && user && (
          <button 
            className={styles.mobileProfileBtn} 
            aria-label="Profile Menu"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{ position: 'relative' }}
          >
            <Menu size={20} />
            
            {/* Profile menu dropdown */}
            {profileMenuOpen && (
              <div 
                className={styles.profileMenuDropdown}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  minWidth: '200px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}
              >
                <div 
                  onClick={() => {
                    setProfileMenuOpen(false);
                    document.getElementById('usage-plan-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Usage & Plan
                </div>
                <div 
                  onClick={() => {
                    setProfileMenuOpen(false);
                    document.getElementById('sportsbooks-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  My Sportsbooks
                </div>
              </div>
            )}
          </button>
        )}
        
        <button 
          className={styles.mobileProfileBtn} 
          aria-label="Profile"
          onClick={() => navigate(user ? "/account" : "/login")}
        >
          <User size={20} />
        </button>
      </div>

      {/* Inline search bar only on Sportsbooks page (desktop only) */}
      {location.pathname.startsWith("/sportsbooks") && (
        <form className={`${styles.navSearch} nav-search`} onSubmit={handleSearchSubmit} role="search">
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
