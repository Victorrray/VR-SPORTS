// src/pages/Account.js
import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import MobileBottomBar from "../components/MobileBottomBar";
import "./Account.css"; // ⬅️ add stylesheet

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
    try {
      navigator.clipboard.writeText(text);
    } catch {}
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
                  <span key={p} className="provider">
                    {p}
                  </span>
                ))}
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
