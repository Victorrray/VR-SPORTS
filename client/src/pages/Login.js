// src/pages/Login.js
import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { signInEmail, signUpEmail, signInWithProvider } = useAuth();
  const [tab, setTab] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const next = search.get("next") || "/account";

  const go = async (fn) => {
    setErr("");
    const { error } = await fn(email, pw);
    if (error) setErr(error.message);
    else navigate(next, { replace: true });
  };

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div
        style={{
          background: "#1b2137",
          border: "1px solid #2a3255",
          borderRadius: 14,
          padding: 24,
          width: 360,
          color: "#e7e9ee",
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setTab("login")}
            style={{ fontWeight: tab === "login" ? 800 : 600 }}
          >
            Log in
          </button>
          <button
            onClick={() => setTab("signup")}
            style={{ fontWeight: tab === "signup" ? 800 : 600 }}
          >
            Sign up
          </button>
        </div>

        {err && <div style={{ color: "#f87171", marginBottom: 8 }}>{err}</div>}

        <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #2a3255",
              background: "#101625",
              color: "#e7e9ee",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #2a3255",
              background: "#101625",
              color: "#e7e9ee",
            }}
          />
        </label>

        {tab === "login" ? (
          <button
            onClick={() => go(signInEmail)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              fontWeight: 800,
              background: "linear-gradient(90deg,#10b981,#34d399)",
              color: "#fff",
              border: 0,
            }}
          >
            Log in
          </button>
        ) : (
          <button
            onClick={() => go(signUpEmail)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              fontWeight: 800,
              background: "linear-gradient(90deg,#10b981,#34d399)",
              color: "#fff",
              border: 0,
            }}
          >
            Create account
          </button>
        )}

        <div style={{ margin: "10px 0", opacity: 0.7, textAlign: "center" }}>
          or
        </div>

        <button
          onClick={() => signInWithProvider("google")}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 12,
            background: "#23263a",
            color: "#e7e9ee",
            border: "1px solid #2a3255",
            fontWeight: 800,
          }}
        >
          Continue with Google
        </button>

        <p style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
          By continuing you agree to our <Link to="/terms">Terms</Link> and{" "}
          <Link to="/privacy">Privacy</Link>.
        </p>
      </div>
    </main>
  );
}
