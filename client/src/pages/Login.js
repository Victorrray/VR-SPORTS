// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { savePricingIntent } from "../lib/intent";
import { debugLog, debugIntentPersistence } from "../lib/debug";
import { Mail, Lock, ArrowRight, Chrome } from "lucide-react";
import "./Login.css";

export default function Login() {
  const auth = useAuth();
  const { signInEmail, signUpEmail, signInWithProvider } = auth || {};
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname === '/signup' ? 'signup' : 'login');
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    const remembered = localStorage.getItem('vr-odds-remember-me') === 'true';
    return remembered ? (localStorage.getItem('vr-odds-remembered-email') || "") : "";
  });
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem('vr-odds-remember-me') === 'true';
  });
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const next = search.get("next") || search.get("returnTo") || "/scores";
  
  const DEBUG_PRICING = process.env.NODE_ENV === 'development';

  // Save intent to localStorage on mount to survive OAuth redirects
  useEffect(() => {
    const intent = search.get("intent");
    const returnTo = search.get("returnTo");
    
    if (intent && returnTo) {
      debugLog('LOGIN', 'Saving intent to localStorage', { intent, returnTo });
      debugIntentPersistence('save', intent, returnTo);
      savePricingIntent(intent, returnTo);
    }
  }, [search]);

  // Listen for auth state changes and redirect when authenticated
  useEffect(() => {
    if (auth?.user && !auth?.loading) {
      console.log('User authenticated, redirecting to:', next);
      navigate(next, { replace: true });
    }
  }, [auth?.user, auth?.loading, next, navigate]);

  const go = async (fn) => {
    if (!fn) {
      setErr("Authentication not available. Please try again.");
      return;
    }
    if (!email || !pw) {
      setErr("Please enter both email and password.");
      return;
    }
    setErr("");
    try {
      // Handle Remember Me functionality by storing preference
      if (rememberMe) {
        localStorage.setItem('vr-odds-remember-me', 'true');
      } else {
        localStorage.removeItem('vr-odds-remember-me');
      }
      
      const { data, error } = await fn(email, pw);
      if (error) {
        console.error('Login error:', error);
        setErr(error.message || "Authentication failed. Please try again.");
      } else {
        console.log('Login successful, data:', data);
        console.log('Navigating to:', next);
        
        // If Remember Me is checked, store user email for next time
        if (rememberMe) {
          localStorage.setItem('vr-odds-remembered-email', email);
        }
        
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          navigate(next, { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setErr(err.message || "Authentication failed. Please try again.");
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

        {tab === "login" && (
          <div className="remember-me" onClick={() => setRememberMe(!rememberMe)}>
            <div className={`remember-toggle ${rememberMe ? 'checked' : ''}`}></div>
            <span className="remember-label">Remember me</span>
          </div>
        )}

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
