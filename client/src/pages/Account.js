// src/pages/Account.js
import React, { useMemo, useState, useEffect } from "react";
import { User, Shield, Copy, Check, AlertCircle, Settings, Mail, Key, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import MobileBottomBar from "../components/MobileBottomBar";
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
  const [busy, setBusy] = useState(false);

  // Profile bits
  const [username, setUsername] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Set-once editor
  const [editingUN, setEditingUN] = useState(false);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("idle"); // idle|checking|ok|invalid|taken|saving|saved|error|locked

  // Load profile (username)
  useEffect(() => {
    async function load() {
      if (!user) { setLoadingProfile(false); return; }
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (!error && data) setUsername(data.username);
      setLoadingProfile(false);
    }
    load();
  }, [user]);

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

  if (!user) {
    return (
      <main className="account-page not-signed">
        <div className="not-signed-inner">
          <h2>You’re not signed in</h2>
          <p>Please log in to view your account.</p>
        </div>
        <MobileBottomBar active="account" showFilter={false} />
      </main>
    );
  }

  return (
    <main className="account-page">
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
                {loadingProfile ? (
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
            onClick={signOut}
          >
            <LogOut size={18} />
            <div className="btn-content">
              <span>Sign Out</span>
              <small>End your current session</small>
            </div>
          </button>
        </div>
      </section>

      <MobileBottomBar active="account" showFilter={false} />
    </main>
  );
}
