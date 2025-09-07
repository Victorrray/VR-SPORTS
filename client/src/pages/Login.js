// src/pages/Login.js
import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Mail, Lock, ArrowRight, Chrome } from "lucide-react";
import "./Login.css";

export default function Login() {
  const auth = useAuth();
  const { signInEmail, signUpEmail, signInWithProvider } = auth || {};
  const [tab, setTab] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const next = search.get("next") || "/account";

  const go = async (fn) => {
    if (!fn) {
      setErr("Authentication not available. Please try again.");
      return;
    }
    setErr("");
    try {
      const { error } = await fn(email, pw);
      if (error) setErr(error.message);
      else navigate(next, { replace: true });
    } catch (err) {
      setErr("Authentication failed. Please try again.");
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome to Odds Sight Seer</h1>
          <p className="login-subtitle">Find profitable betting opportunities with AI</p>
        </div>

        <div className="tab-switcher">
          <button
            onClick={() => setTab("login")}
            className={`tab-btn ${tab === "login" ? "active" : ""}`}
          >
            Log in
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`tab-btn ${tab === "signup" ? "active" : ""}`}
          >
            Sign up
          </button>
        </div>

        {err && <div className="error-message">{err}</div>}

        <div className="input-group">
          <label className="input-label">
            <Mail size={16} />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="login-input"
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <Lock size={16} />
            Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            className="login-input"
          />
        </div>

        {tab === "login" ? (
          <button
            onClick={() => go(signInEmail)}
            className="primary-btn"
          >
            <span>Log in</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => go(signUpEmail)}
            className="primary-btn"
          >
            <span>Create account</span>
            <ArrowRight size={18} />
          </button>
        )}

        {/* Google OAuth temporarily disabled - needs Supabase configuration
        <div className="divider">
          <span>or</span>
        </div>

        <button
          onClick={() => signInWithProvider("google")}
          className="google-btn"
        >
          <Chrome size={18} />
          <span>Continue with Google</span>
        </button>
        */}

        <p className="terms-text">
          By continuing you agree to our <Link to="/terms" className="terms-link">Terms</Link> and{" "}
          <Link to="/privacy" className="terms-link">Privacy</Link>.
        </p>
      </div>
    </main>
  );
}
