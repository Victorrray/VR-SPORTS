// src/components/layout/NavbarRevamped.js
// Modern, revamped navigation bar with enhanced UX
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  Search, User, ChevronDown, CreditCard, Settings, Menu, X,
  Home, BarChart3, TrendingUp, LogOut, Bell, Zap, Shield
} from "lucide-react";
import { useAuth } from "../../hooks/SimpleAuth";
import { useMe } from "../../hooks/useMe";
import styles from "./NavbarRevamped.module.css";

export default function NavbarRevamped({ onOpenMobileSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const profile = auth?.profile;
  const { me } = useMe();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  // Keep search input in sync with URL ?q
  useEffect(() => {
    const isSports = location.pathname.startsWith("/sportsbooks");
    const params = new URLSearchParams(location.search);
    setQ(isSports ? (params.get("q") || "") : "");
  }, [location.pathname, location.search]);

  const navLinks = [
    { label: "Home", to: "/", icon: Home },
    { label: "Odds", to: "/sportsbooks", icon: BarChart3, requiresAuth: true },
    { label: "Picks", to: "/picks", icon: TrendingUp, requiresAuth: true },
    { label: "Scores", to: "/scores", icon: Shield, requiresAuth: true },
  ];

  // Don't filter - show all links but handle clicks for protected routes
  const filteredNavLinks = navLinks;
  
  // Check if on login/signup page
  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';

  // Handle navigation for protected routes
  const handleNavClick = (link, e) => {
    if (link.requiresAuth && !user) {
      e.preventDefault();
      navigate("/login");
    }
  };

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    navigate(`/sportsbooks?${params.toString()}`);
    setSearchActive(false);
  }

  const handleLogout = async () => {
    try {
      await auth?.signOut?.();
      setUserMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpgrade = () => {
    navigate("/subscribe");
    setUserMenuOpen(false);
  };

  const getPlanBadge = () => {
    if (!me?.plan) return null;
    const planConfig = {
      platinum: { label: "Platinum", color: "#a78bfa", icon: "⭐" },
      gold: { label: "Gold", color: "#fbbf24", icon: "✨" },
      free: { label: "Free", color: "#6b7280", icon: "🎯" }
    };
    return planConfig[me.plan] || planConfig.free;
  };

  const planBadge = getPlanBadge();
  const isLandingPage = location.pathname === "/";

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        {/* Left Section: Logo + Mobile Menu (on landing page) */}
        <div className={styles.navLeft}>
          {isLandingPage && (
            <button
              className={styles.hamburger}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          <Link to="/" className={styles.brand}>
            <div className={styles.brandLogo}>
              <span className={styles.logoText}>ODD</span>
              <span className={styles.logoAccent}>SIGHT</span>
              <span className={styles.logoText}>SEER</span>
            </div>
          </Link>
        </div>

        {/* Center Section: Navigation Links (Desktop) */}
        <div className={styles.navCenter}>
          {filteredNavLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavClick(link, e)}
                className={`${styles.navLink} ${isActive(link.to) ? styles.active : ""}`}
                title={link.label}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Section: Search + User Menu + Mobile Menu (non-landing) */}
        <div className={styles.navRight}>
          {/* Mobile Menu Button (on non-landing pages) */}
          {!isLandingPage && (
            <button
              className={styles.hamburger}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* User Section - Hide on login/signup pages */}
          {!isLoginPage && !user ? (
            <Link to="/login" className={styles.loginBtn}>
              <User size={18} />
              <span>Sign In</span>
            </Link>
          ) : !isLoginPage && (
            <div className={styles.userSection}>
              {/* Plan Badge */}
              {planBadge && (
                <div className={`${styles.planBadge} ${styles[`plan-${me?.plan}`]}`}>
                  <span className={styles.planIcon}>{planBadge.icon}</span>
                  <span className={styles.planLabel}>{planBadge.label}</span>
                </div>
              )}

              {/* User Menu Button */}
              <button
                className={styles.userButton}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
              >
                <div className={styles.userAvatar}>
                  <User size={18} />
                </div>
                <ChevronDown size={16} className={`${styles.chevron} ${userMenuOpen ? styles.open : ""}`} />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className={styles.userDropdown}>
                  {/* User Info */}
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      <User size={20} />
                    </div>
                    <div className={styles.userDetails}>
                      <div className={styles.userName}>{profile?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}</div>
                      <div className={styles.userPlan}>
                        {me?.plan ? `${me.plan.charAt(0).toUpperCase() + me.plan.slice(1)} Plan` : "Free Plan"}
                      </div>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  {/* Menu Items */}
                  <Link
                    to="/my-sportsbooks"
                    className={styles.dropdownItem}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={18} />
                    <div>
                      <div className={styles.itemLabel}>My Sportsbooks</div>
                      <div className={styles.itemDesc}>Manage your books</div>
                    </div>
                  </Link>

                  <Link
                    to="/account"
                    className={styles.dropdownItem}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User size={18} />
                    <div>
                      <div className={styles.itemLabel}>Account Settings</div>
                      <div className={styles.itemDesc}>Profile & preferences</div>
                    </div>
                  </Link>

                  <Link
                    to="/subscribe"
                    className={styles.dropdownItem}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Zap size={18} />
                    <div>
                      <div className={styles.itemLabel}>Subscription</div>
                      <div className={styles.itemDesc}>Manage plan</div>
                    </div>
                  </Link>

                  <div className={styles.divider} />

                  {/* Upgrade Button (if not platinum) */}
                  {me?.plan !== "platinum" && (
                    <button
                      className={styles.upgradeBtn}
                      onClick={handleUpgrade}
                    >
                      <Zap size={18} />
                      Upgrade to Platinum
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuContent}>
            {/* Mobile Navigation Links */}
            {filteredNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`${styles.mobileNavLink} ${isActive(link.to) ? styles.active : ""}`}
                  onClick={(e) => {
                    handleNavClick(link, e);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className={styles.mobileDivider} />

            {/* Mobile User Section */}
            {!user ? (
              <Link
                to="/login"
                className={styles.mobileLoginBtn}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={20} />
                Sign In
              </Link>
            ) : (
              <>
                <Link
                  to="/my-sportsbooks"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings size={20} />
                  My Sportsbooks
                </Link>

                <Link
                  to="/account"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={20} />
                  Account
                </Link>

                <Link
                  to="/subscribe"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Zap size={20} />
                  Subscription
                </Link>

                <div className={styles.mobileDivider} />

                <button
                  className={styles.mobileLogoutBtn}
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
