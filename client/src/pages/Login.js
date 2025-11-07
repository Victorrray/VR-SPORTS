// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/SimpleAuth";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, ArrowRight, Chrome } from "lucide-react";
import { optimizedStorage } from "../utils/storageOptimizer";
import "./Login-revamp.css";

export default function Login() {
  const auth = useAuth();
  const { signIn, signUp, signInWithGoogle, signInWithApple } = auth || {};
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname === '/signup' ? 'signup' : 'login');
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    const remembered = optimizedStorage.get('vr-odds-remember-me', false);
    return remembered ? optimizedStorage.get('vr-odds-remembered-email', '') : "";
  });
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return false;
    return optimizedStorage.get('vr-odds-remember-me', false);
  });
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const next = search.get("next") || search.get("returnTo") || "/";
  
  const DEBUG_PRICING = process.env.NODE_ENV === 'development';

  // Save intent to localStorage on mount to survive OAuth redirects
  useEffect(() => {
    const intent = search.get("intent");
    const returnTo = search.get("returnTo");
    
    if (intent && returnTo) {
      // Save pricing intent to localStorage for post-auth redirect
      try {
        optimizedStorage.set('pricingIntent', { intent, returnTo }, { priority: 'high', ttl: 30 * 60 * 1000 }); // 30 minutes
      } catch (error) {
        console.warn('Failed to save pricing intent:', error);
      }
    }
  }, [search]);

  // Handle sign out and authentication messages
  useEffect(() => {
    const signingOut = search.get("signing_out");
    const signedOut = search.get("signed_out");
    const signOutError = search.get("sign_out_error");
    const authRequired = search.get("auth_required");
    
    if (signingOut) {
      setErr("Signing you out...");
    } else if (signedOut) {
      setErr("You have been signed out successfully.");
    } else if (signOutError) {
      setErr("Sign out completed (with errors). Please sign in again.");
    } else if (authRequired) {
      setErr("Your session has expired. Please sign in again to continue.");
    }
  }, [search]);

  // Listen for auth state changes and redirect when authenticated
  useEffect(() => {
    if (auth?.user && !auth?.authLoading) {
      console.log('User authenticated, redirecting to:', next);
      navigate(next, { replace: true });
    }
  }, [auth?.user, auth?.authLoading, next, navigate]);

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
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErr("Please enter a valid email address.");
        return;
      }
      
      // Validate password length
      if (pw.length < 6) {
        setErr("Password must be at least 6 characters.");
        return;
      }
      
      // Handle Remember Me functionality by storing preference
      if (rememberMe) {
        optimizedStorage.set('vr-odds-remember-me', true, { priority: 'high' });
      } else {
        optimizedStorage.remove('vr-odds-remember-me');
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
          optimizedStorage.set('vr-odds-remembered-email', email, { priority: 'high' });
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

  // Validate auth context is available (after all hooks)
  if (!auth) {
    return (
      <main className="login-container">
        <div className="login-card">
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-primary)' }}>
            <h2>Authentication Unavailable</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
              The authentication system is not available. Please refresh the page and try again.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Find profitable betting opportunities</p>
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
            onClick={() => go(signIn)}
            className="primary-btn"
          >
            <span>Log in</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => go(signUp)}
            className="primary-btn"
          >
            <span>Create account</span>
            <ArrowRight size={18} />
          </button>
        )}

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', opacity: 0.6 }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => {
              if (!signInWithGoogle) {
                setErr("Google sign-in is not available. Please try again.");
                return;
              }
              signInWithGoogle();
            }}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              color: '#000000',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 1)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <Chrome size={18} />
            Google
          </button>
          {/* Apple login disabled for now - enable when provider is configured
          <button
            onClick={() => signInWithApple?.()}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            Continue with Apple
          </button>
          */}
        </div>

        <p className="terms-text">
          By continuing you agree to our <Link to="/terms" className="terms-link">Terms</Link> and{" "}
          <Link to="/privacy" className="terms-link">Privacy</Link>.
        </p>
      </div>
    </main>
  );
}
