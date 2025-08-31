// src/pages/Account.js
import React, { useMemo, useState, useEffect } from "react";
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
    const { error } = await supabase
      .from("profiles")
      .update({ username: v })
      .eq("id", user.id);

    if (!error) {
      setUsername(v);
      setEditingUN(false);
      setStatus("saved");
      return;
    }
    // Taken (unique violation)
    if (error.code === "23505") {
      setStatus("taken");
      return;
    }
    // Locked by trigger (set-once)
    if (error.code === "P0001" && /USERNAME_LOCKED/i.test(error.message || "")) {
      setStatus("locked");
      setEditingUN(false);
      return;
    }
    setStatus("error");
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
        <h1>Profile</h1>
        <p>Manage your account and security settings.</p>
      </header>

      {/* Profile card */}
      <section className="card">
        <h2>Account</h2>
        <div className="profile">
          <div className="avatar">{initialsFromEmail(email)}</div>

          <div className="profile-info">
            <div className="email-row">
              <strong>{email}</strong>
              {emailVerified ? (
                <span className="badge verified">Verified</span>
              ) : (
                <span className="badge not-verified">Not verified</span>
              )}
            </div>

            <div className="user-id">
              User ID: <code>{maskId(user.id)}</code>
              <button onClick={() => copy(user.id)} className="copy-btn">
                Copy
              </button>
            </div>

            {providers.length > 0 && (
              <div className="providers">
                {providers.map((p) => (
                  <span key={p} className="provider">{p}</span>
                ))}
              </div>
            )}

            {/* Username / Set-once editor */}
            <div className="username-row" style={{ marginTop: 14 }}>
              <div className="username-left">
                <span className="label">Username:</span>{" "}
                {loadingProfile ? (
                  <span className="muted">Loading…</span>
                ) : username ? (
                  <strong>@{username}</strong>
                ) : (
                  <span className="muted">Not set</span>
                )}
              </div>

              {/* Only allow setting if not yet set */}
              {!loadingProfile && !username && !editingUN && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setEditingUN(true); setValue(""); setStatus("idle"); }}
                >
                  Set username
                </button>
              )}
            </div>

            {editingUN && !username && (
              <div className="username-editor">
                <div className="field">
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Choose username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <div className="hint">
                    {status === "checking" && "Checking…"}
                    {status === "ok" && "Available ✔"}
                    {status === "taken" && "Already taken"}
                    {status === "invalid" && "Use 3–20 letters, numbers, _ (no leading/trailing _)"}
                    {status === "saving" && "Saving…"}
                    {status === "saved" && "Saved ✔"}
                    {status === "error" && "Error saving. Try again."}
                    {status === "locked" && "Your username is locked and cannot be changed."}
                  </div>
                </div>
                <div className="row" style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={status !== "ok"}
                    onClick={saveUsername}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => { setEditingUN(false); setValue(""); setStatus("idle"); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* If already set, optionally show a lock note */}
            {!loadingProfile && username && (
              <div className="hint" style={{ marginTop: 8, opacity: 0.75, fontSize: 13 }}>
                Your username is permanent and cannot be changed.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Security card */}
      <section className="card">
        <h2>Security</h2>
        <div className="actions">
          <button onClick={handleResetPassword} disabled={busy}>
            {busy ? "Sending…" : "Send password reset link"}
          </button>
          <button className="danger" onClick={signOut}>
            Sign out
          </button>
        </div>
      </section>

      <MobileBottomBar active="account" showFilter={false} />
    </main>
  );
}
