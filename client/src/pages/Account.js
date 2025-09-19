// src/pages/Account.js - Updated styling
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMe } from "../hooks/useMe";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { User, Lock, Eye, EyeOff, Save, BookOpen, Check, AlertCircle, Mail, Settings, Shield, Key, LogOut, Crown, Zap, CreditCard, X, Twitter, Instagram, MessageCircle } from "lucide-react";
import MobileBottomBar from "../components/MobileBottomBar";
import SportMultiSelect from "../components/SportMultiSelect";
import UsagePlanCard from "../components/UsagePlanCard";
import { AVAILABLE_SPORTSBOOKS } from '../constants/sportsbooks';
import "./Account.css";

function initialsFromEmail(email = "") {
  const name = (email || "").split("@")[0] || "U";
  const parts = name.replace(/[._-]+/g, " ").trim().split(" ");
  const a = (parts[0] || "U")[0];
  const b = (parts[1] || "")[0];
  return (a + (b || "")).toUpperCase();
}
function maskId(id = "") {
  if (!id) return "—";
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const { me } = useMe();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedSportsbooks, setSelectedSportsbooks] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);

  // Debug logging
  console.log('🔍 Account component render:', { user: !!user, userId: user?.id });

  // Profile bits
  const [editingUN, setEditingUN] = useState(false);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("idle"); // idle|checking|ok|invalid|taken|saving|saved|error|locked

  // Sportsbook selection
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load profile (username) and sportsbooks
  useEffect(() => {
    async function load() {
      let safetyTimer;
      try {
        if (!user) { setPageLoading(false); return; }
        // If Supabase client is not available, fail fast
        if (!supabase) {
          console.warn('Account: Supabase client not initialized');
          setError('Unable to load profile. Please try again later.');
          setPageLoading(false);
          return;
        }
        setPageLoading(true);
        // Safety guard to prevent indefinite spinner
        safetyTimer = setTimeout(() => setPageLoading(false), 2500);
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        if (!error && data && data.username) setUsername(data.username);
        if (error && error.code !== 'PGRST116') {
          // Log non-not-found errors
          console.error('Account: Failed to load username', error);
          setError('Failed to load profile');
        }
      } catch (e) {
        console.error('Account: Exception while loading profile', e);
        setError('Failed to load profile');
      } finally {
        setPageLoading(false);
        // Clear safety guard
        try { if (safetyTimer) clearTimeout(safetyTimer); } catch {}
      }
    }
    load();
    
    // Load user's selected sportsbooks from localStorage
    const saved = localStorage.getItem('userSelectedSportsbooks');
    if (saved) {
      setSelectedBooks(JSON.parse(saved));
    } else {
      // Default to popular sportsbooks
      setSelectedBooks(['draftkings', 'fanduel', 'betmgm', 'caesars']);
    }
  }, [user]);

  // Handle sportsbook preferences save
  const handleSavePreferences = () => {
    setSavingPrefs(true);
    try {
      localStorage.setItem('userSelectedSportsbooks', JSON.stringify(selectedBooks));
      setSaveStatus('Preferences saved successfully!');
      setTimeout(() => {
        setSaveStatus('');
        setSavingPrefs(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus('Error saving preferences');
      setTimeout(() => {
        setSaveStatus('');
        setSavingPrefs(false);
      }, 3000);
    }
  };

  // Availability check (debounced)
  useEffect(() => {
    if (!editingUN) return;
    const v = value.trim();
    const t = setTimeout(async () => {
      const ok = /^[A-Za-z0-9_]{3,20}$/.test(v) && !/^_|_$/.test(v);
      if (!ok) { setStatus("invalid"); return; }
      setStatus("checking");
      const { data, error } = await supabase.rpc("username_available", { candidate: v });
      if (error) { setStatus("invalid"); return; }
      setStatus(data ? "ok" : "taken");
    }, 350);
    return () => clearTimeout(t);
  }, [value, editingUN]);

  const handleBookToggle = (bookKey) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookKey)) {
        return prev.filter(key => key !== bookKey);
      } else {
        return [...prev, bookKey];
      }
    });
  };

  const handleSaveSportsbooks = () => {
    localStorage.setItem('userSelectedSportsbooks', JSON.stringify(selectedBooks));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  async function saveUsername() {
    const v = value.trim();
    // local guard
    if (!/^[A-Za-z0-9_]{3,20}$/.test(v) || /^_|_$/.test(v)) {
      setStatus("invalid");
      return;
    }
    if (status !== "ok") return;

    setStatus("saving");
    
    try {
      // Save to database first
      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, username: v });

      if (dbError) {
        // Taken (unique violation)
        if (dbError.code === "23505") {
          setStatus("taken");
          return;
        }
        throw dbError;
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: v }
      });

      if (authError) throw authError;

      // Save to localStorage for persistence
      localStorage.setItem(`username_${user.id}`, v);

      setUsername(v);
      setEditingUN(false);
      setStatus("saved");
    } catch (error) {
      console.error("Error saving username:", error);
      setStatus("error");
    }
  }

  const email =
    user?.email ??
    user?.user_metadata?.email ??
    user?.identities?.[0]?.identity_data?.email ??
    "unknown@email.com";

  const providers = useMemo(() => {
    const p =
      user?.app_metadata?.providers ||
      (user?.app_metadata?.provider ? [user.app_metadata.provider] : []);
    return Array.isArray(p) ? p : [];
  }, [user]);

  const emailVerified =
    user?.user_metadata?.email_verified === true ||
    user?.email_confirmed_at != null;

  async function handleResetPassword() {
    if (!email) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      });
      if (error) throw error;
      alert("Reset link sent! Check your inbox.");
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not send reset link.");
    } finally {
      setBusy(false);
    }
  }

  function copy(text) {
    try { navigator.clipboard.writeText(text); } catch {}
  }

  const [signOutProgress, setSignOutProgress] = useState(null);
  const [signOutError, setSignOutError] = useState(null);

  const handleSignOut = async () => {
    if (signOutBusy) return;
    console.log('🔐 Account: Sign out button clicked');
    setSignOutBusy(true);
    setSignOutError(null);
    
    try {
      console.log('🔐 Account: Starting sign out...');
      
      // Use the useAuth hook's signOut method for consistency
      await signOut();
      
      // Clear any additional local storage items
      localStorage.removeItem('userSelectedSportsbooks');
      localStorage.removeItem('pricingIntent');

      // Redirect to home page with signed out indicator using client routing
      setSignOutBusy(false);
      navigate('/?signed_out=true', { replace: true });
      
    } catch (error) {
      console.error('🔐 Account: Sign out failed:', error);
      setSignOutError(error.message);
      setSignOutBusy(false);
      setSignOutProgress(null);
    }
  };

  const handleCancelSubscription = () => {
    navigate('/billing/cancel');
  };

  const handleUpgradeToPlatinum = async () => {
    if (loading || !user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseUserId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (!user || pageLoading) {
    return (
      <div className="loading-fallback">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="account-page">
      {error && (
        <div
          role="alert"
          style={{
            margin: '12px auto',
            maxWidth: 960,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(248,113,113,0.35)',
            color: 'rgb(252,165,165)'
          }}
        >
          Profile failed to load. Some info may be unavailable.
        </div>
      )}
      <header className="account-header">
        <div className="header-title">
          <User className="header-icon" size={32} />
          <div>
            <h1>Profile</h1>
            <p>Manage your account and security settings</p>
          </div>
        </div>
      </header>

      {/* Profile card */}
      <section className="profile-card">
        <div className="card-header">
          <User size={20} />
          <h2>Account Information</h2>
        </div>
        
        <div className="profile-content">
          <div className="user-info-grid">
            <div className="user-avatar-section">
              <div className="avatar">{initialsFromEmail(email)}</div>
              <div className={`status-badge ${me?.plan === 'platinum' ? 'platinum' : 'free-trial'}`}>
                {me?.plan === 'platinum' ? (
                  <>
                    <Crown size={12} />
                    <span>Platinum</span>
                  </>
                ) : (
                  <>
                    <Zap size={12} />
                    <span>Free Trial</span>
                  </>
                )}
              </div>
            </div>

            <div className="user-details-section">
              <div className="user-field">
                <div className="field-header">
                  <Mail size={16} />
                  <span className="field-label">Email Address</span>
                </div>
                <div className="field-value">{email}</div>
              </div>

              <div className="user-field">
                <div className="field-header">
                  <User size={16} />
                  <span className="field-label">Username</span>
                </div>
                <div className="field-value">
                  {pageLoading ? (
                    <span className="loading-text">Loading…</span>
                  ) : username ? (
                    <div className="username-display">
                      <strong>@{username}</strong>
                    </div>
                  ) : (
                    <div className="username-empty">
                      <span className="not-set">Not set</span>
                      {!editingUN && (
                        <button
                          type="button"
                          className="set-username-btn"
                          onClick={() => { setEditingUN(true); setValue(""); setStatus("idle"); }}
                        >
                          Set Username
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {editingUN && !username && (
              <div className="username-editor">
                <div className="editor-field">
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Choose username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className="username-input"
                  />
                  <div className={`status-hint ${status}`}>
                    {status === "checking" && "Checking availability..."}
                    {status === "ok" && (
                      <><Check size={14} /> Available</>  
                    )}
                    {status === "taken" && (
                      <><AlertCircle size={14} /> Already taken</>
                    )}
                    {status === "invalid" && "Use 3–20 letters, numbers, _ (no leading/trailing _)"}
                    {status === "saving" && "Saving..."}
                    {status === "saved" && (
                      <><Check size={14} /> Saved successfully</>
                    )}
                    {status === "error" && "Error saving. Try again."}
                    {status === "locked" && "Username is locked and cannot be changed."}
                  </div>
                </div>
                <div className="editor-actions">
                  <button
                    type="button"
                    className="save-btn"
                    disabled={status !== "ok"}
                    onClick={saveUsername}
                  >
                    <Check size={16} />
                    Save
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => { setEditingUN(false); setValue(""); setStatus("idle"); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>

      {/* Security card */}
      <section className="security-card">
        <div className="card-header">
          <Shield size={20} />
          <h2>Security & Access</h2>
        </div>
        
        <div className="security-actions">
          <button 
            onClick={handleResetPassword} 
            disabled={busy}
            className="security-btn reset-btn"
          >
            <Key size={18} />
            <div className="btn-content">
              <span>{busy ? "Sending..." : "Reset Password"}</span>
              <small>Send reset link to your email</small>
            </div>
          </button>
          
          <button 
            className="security-btn signout-btn" 
            onClick={handleSignOut}
            disabled={signOutBusy}
            data-testid="btn-signout"
          >
            <LogOut size={18} />
            <div className="btn-content">
              <span>
                {signOutBusy 
                  ? (signOutProgress 
                      ? `${signOutProgress.step}... (${signOutProgress.current}/${signOutProgress.total})`
                      : 'Signing out...'
                    )
                  : 'Sign Out'
                }
              </span>
              <small>
                {signOutError 
                  ? `Error: ${signOutError}` 
                  : 'End your current session'
                }
              </small>
            </div>
          </button>
        </div>
      </section>

      {/* Subscription Management */}
      <section className="subscription-card">
        <div className="card-header">
          <CreditCard size={20} />
          <h2>Subscription</h2>
        </div>
        <div className="subscription-content">
          <div className="subscription-status">
            <div className="status-info">
              <div className="plan-badge">
                <span className={`plan-indicator ${me?.plan || 'free'}`}>
                  {me?.plan === 'platinum' ? '💎' : '🆓'}
                </span>
                <div className="plan-details">
                  <span className="plan-name">
                    {me?.plan === 'platinum' ? 'Platinum Plan' : 'Free Plan'}
                  </span>
                  <span className="plan-desc">
                    {me?.plan === 'platinum' 
                      ? 'Unlimited API access & premium features' 
                      : `${me?.calls_made || 0}/${me?.limit || 250} API calls used`
                    }
                  </span>
                </div>
              </div>
            </div>
            
            {me?.plan === 'platinum' && (
              <div className="subscription-actions">
                <button 
                  className="security-btn cancel-btn"
                  onClick={handleCancelSubscription}
                >
                  <X size={16} />
                  <div className="btn-content">
                    <span>Cancel Subscription</span>
                    <small>Manage your subscription</small>
                  </div>
                </button>
              </div>
            )}
            
            {me?.plan !== 'platinum' && (
              <div className="subscription-actions">
                <button 
                  className="security-btn upgrade-btn"
                  onClick={handleUpgradeToPlatinum}
                  disabled={loading}
                >
                  <CreditCard size={16} />
                  <div className="btn-content">
                    <span>{loading ? 'Creating checkout...' : 'Upgrade to Platinum'}</span>
                    <small>Unlimited access & features</small>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          <div className="subscription-info">
            <p className="subscription-note">
              {me?.plan === 'platinum' 
                ? 'You have unlimited access to all features. Cancel anytime.' 
                : 'Upgrade to Platinum for unlimited API access and premium features.'
              }
            </p>
            
          </div>
        </div>
      </section>

      {/* Hidden sections - only accessible via hamburger menu */}
      <div id="usage-plan-section" style={{ display: 'none' }}>
        <UsagePlanCard />
      </div>


      {/* Social Media Section */}
      <section className="social-media-card">
        <div className="card-header">
          <MessageCircle size={20} />
          <h2>Follow Us</h2>
        </div>
        <div className="social-content">
          <p className="social-description">
            Stay updated with the latest odds, tips, and platform updates
          </p>
          <div className="social-links">
            <a 
              href="https://x.com/OddSightSeer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link twitter"
              aria-label="Follow us on Twitter"
            >
              <Twitter size={20} />
              <span>Twitter</span>
            </a>
            <a 
              href="https://www.instagram.com/oddsightseer/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link instagram"
              aria-label="Follow us on Instagram"
            >
              <Instagram size={20} />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </section>

      {/* Version info */}
      <div className="version-info">
        <span>Version 2.63</span>
      </div>

      <MobileBottomBar active="profile" showFilter={false} />
    </main>
  );
}
