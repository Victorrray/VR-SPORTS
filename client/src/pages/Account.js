// src/pages/Account.js
import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

function initialsFromEmail(email = "") {
  const name = email.split("@")[0];
  if (!name) return "U";
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
    const p = user?.app_metadata?.providers || (user?.app_metadata?.provider ? [user.app_metadata.provider] : []);
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
      <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2>You’re not signed in</h2>
          <p>Please log in to view your account.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: 16 }}>Account</h1>

      {/* Profile card */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr",
          gap: 16,
          padding: 16,
          border: "1px solid #2a3255",
          background: "#121a2b",
          borderRadius: 16,
          alignItems: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            fontSize: 22,
            color: "#fff",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 50%, #0b1020), var(--accent))",
            border: "1px solid #2a3255",
          }}
        >
          {initialsFromEmail(email)}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 18 }}>{email}</strong>
            {emailVerified ? (
              <span
                title="Email verified"
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(16,185,129,.15)",
                  border: "1px solid rgba(16,185,129,.35)",
                  color: "#a7f3d0",
                }}
              >
                Verified
              </span>
            ) : (
              <span
                title="Email not verified"
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(245,158,11,.15)",
                  border: "1px solid rgba(245,158,11,.35)",
                  color: "#fde68a",
                }}
              >
                Not verified
              </span>
            )}
          </div>

          <div style={{ marginTop: 6, opacity: 0.8, fontSize: 14 }}>
            User ID: <code>{maskId(user.id)}</code>{" "}
            <button
              onClick={() => copy(user.id)}
              style={{
                marginLeft: 8,
                fontSize: 12,
                padding: "2px 6px",
                borderRadius: 8,
                border: "1px solid #2a3255",
                background: "#1b2137",
                color: "#e7e9ee",
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>

          {providers.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {providers.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#1b2137",
                    border: "1px solid #2a3255",
                    color: "#bbcbff",
                    textTransform: "capitalize",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <section
        style={{
          marginTop: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleResetPassword}
          disabled={busy}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #2a3255",
            background: "#23263a",
            color: "#e7e9ee",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {busy ? "Sending…" : "Send reset password link"}
        </button>

        <button
          onClick={signOut}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #7f1d1d",
            background: "#3f1f22",
            color: "#fecaca",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </section>

      {/* Advanced / raw json (collapsible) */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", opacity: 0.9 }}>Advanced: raw profile JSON</summary>
        <pre
          style={{
            background: "#0e1423",
            padding: 12,
            borderRadius: 10,
            overflow: "auto",
            color: "#e7e9ee",
            fontSize: "0.85em",
            border: "1px solid #2a3255",
            marginTop: 10,
          }}
        >
          {JSON.stringify(
            {
              id: user.id,
              email,
              app_metadata: user.app_metadata,
              user_metadata: user.user_metadata,
            },
            null,
            2
          )}
        </pre>
      </details>
    </main>
  );
}
