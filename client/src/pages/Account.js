// src/pages/Account.js
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { signOutAndRefresh } from "../lib/authActions";
import { User, Lock, Eye, EyeOff, Save, BookOpen, Check, AlertCircle, Mail, Settings, Shield, Key, LogOut } from "lucide-react";
import MobileBottomBar from "../components/MobileBottomBar";
import SportMultiSelect from "../components/SportMultiSelect";
import UsagePlanCard from "../components/UsagePlanCard";
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

const AVAILABLE_SPORTSBOOKS = [
  { key: 'draftkings', name: 'DraftKings', popular: true },
  { key: 'fanduel', name: 'FanDuel', popular: true },
  { key: 'betmgm', name: 'BetMGM', popular: true },
  { key: 'caesars', name: 'Caesars', popular: true },
  { key: 'espnbet', name: 'ESPN BET', popular: true },
  { key: 'pointsbetau', name: 'PointsBet', popular: true },
  { key: 'hardrockbet', name: 'Hard Rock Bet', popular: true },
  { key: 'unibet_us', name: 'Unibet', popular: false },
  { key: 'williamhill_us', name: 'William Hill', popular: false },
  { key: 'betrivers', name: 'BetRivers', popular: false },
  { key: 'wynnbet', name: 'WynnBET', popular: false },
  { key: 'superbook', name: 'SuperBook', popular: false },
  { key: 'barstool', name: 'Barstool', popular: false },
  { key: 'twinspires', name: 'TwinSpires', popular: false },
  { key: 'foxbet', name: 'FOX Bet', popular: false },
  { key: 'betfred_us', name: 'Betfred', popular: false },
  { key: 'fliff', name: 'Fliff', popular: false },
  { key: 'superdraft', name: 'SuperDraft', popular: false },
  { key: 'prizepicks', name: 'PrizePicks', popular: false },
  { key: 'underdog', name: 'Underdog Fantasy', popular: false },
  { key: 'draftkings_pick6', name: 'DraftKings Pick6', popular: false },
  { key: 'betonlineag', name: 'BetOnline.ag', popular: false },
  { key: 'lowvig', name: 'LowVig.ag', popular: false },
  { key: 'mybookieag', name: 'MyBookie.ag', popular: false },
  { key: 'bovada', name: 'Bovada', popular: false },
  { key: 'gtbets', name: 'GTBets', popular: false },
  { key: 'betdsi', name: 'BetDSI', popular: false },
  { key: 'heritage', name: 'Heritage Sports', popular: false },
  { key: 'intertops', name: 'Intertops', popular: false },
  { key: 'sportsbetting', name: 'SportsBetting.ag', popular: false }
];

export default function Account() {
  const { user } = useAuth();
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

  // Load profile (username) and sportsbooks
  useEffect(() => {
    async function load() {
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
    try {
      localStorage.setItem('userSelectedSportsbooks', JSON.stringify(selectedBooks));
      setSaveStatus('Preferences saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error saving preferences');
      setTimeout(() => setSaveStatus(''), 3000);
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

  const handleSignOut = async () => {
    if (signOutBusy) return;
    setSignOutBusy(true);
    await signOutAndRefresh('/');
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
          <div className="avatar-section">
            <div className="avatar">{initialsFromEmail(email)}</div>
            <div className="avatar-status">
              {emailVerified ? (
                <div className="status-badge verified">
                  <Check size={12} />
                  <span>Verified</span>
                </div>
              ) : (
                <div className="status-badge unverified">
                  <AlertCircle size={12} />
                  <span>Unverified</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-row">
              <div className="detail-label">
                <Mail size={16} />
                <span>Email Address</span>
              </div>
              <div className="detail-value">{email}</div>
            </div>


            {providers.length > 0 && (
              <div className="detail-row">
                <div className="detail-label">
                  <Settings size={16} />
                  <span>Auth Providers</span>
                </div>
                <div className="providers">
                  {providers.map((p) => (
                    <span key={p} className="provider-badge">{p}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-row">
              <div className="detail-label">
                <User size={16} />
                <span>Username</span>
              </div>
              <div className="username-section">
                {pageLoading ? (
                  <span className="loading-text">Loading…</span>
                ) : username ? (
                  <div className="username-display">
                    <strong>@{username}</strong>
                    <span className="permanent-note">Permanent</span>
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
              <span>{signOutBusy ? 'Signing out...' : 'Sign Out'}</span>
              <small>End your current session</small>
            </div>
          </button>
        </div>
      </section>

      {/* Usage & Plan Card */}
      <UsagePlanCard />

      {/* Sportsbook Selection */}
      <section className="sportsbook-card">
        <div className="card-header">
          <BookOpen size={20} />
          <h2>My Sportsbooks</h2>
        </div>
        <p className="section-description">Select the sportsbooks you use to see personalized odds and recommendations</p>
        
        <div className="sportsbook-selection">
          <div className="selection-info">
            <span className="selected-count">{selectedBooks.length} sportsbooks selected</span>
          </div>
          
          <div className="dropdown-container">
            <SportMultiSelect
              list={AVAILABLE_SPORTSBOOKS.map(book => ({
                key: book.key,
                title: book.name
              }))}
              selected={selectedBooks}
              onChange={setSelectedBooks}
              placeholderText="Select sportsbooks..."
              allLabel="All Sportsbooks"
              grid={true}
              columns={2}
              leftAlign={true}
              usePortal={true}
              portalAlign="up"
            />
          </div>
          
          <div className="save-section">
            <button className="save-btn" onClick={handleSavePreferences}>
              <Save size={16} />
              Save Preferences
            </button>
            <p className="save-note">
              Your dashboard will only show odds from your selected sportsbooks
            </p>
          </div>
        </div>
      </section>

      <MobileBottomBar active="profile" showFilter={false} />
    </main>
  );
}
