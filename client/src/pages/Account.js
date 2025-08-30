// src/pages/Account.js
import React from "react";
import { useAuth } from "../auth/AuthProvider";

export default function Account() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2>You are not logged in.</h2>
          <p>Please sign in to view your account details.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Account</h1>

      <section style={{ marginTop: 16 }}>
        <h3>Profile</h3>
        <pre
          style={{
            background: "#111827",
            padding: 12,
            borderRadius: 10,
            overflow: "auto",
            color: "#e7e9ee",
            fontSize: "0.9em",
          }}
        >
          {JSON.stringify(
            {
              id: user.id,
              email:
                user.email ??
                user.user_metadata?.email ??
                user?.identities?.[0]?.identity_data?.email,
              app_metadata: user.app_metadata,
              user_metadata: user.user_metadata,
            },
            null,
            2
          )}
        </pre>

        <button
          onClick={signOut}
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #2a3255",
            background: "#1b2137",
            color: "#e7e9ee",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
