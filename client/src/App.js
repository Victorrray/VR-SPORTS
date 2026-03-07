// file: src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/SimpleAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AccessibilityProvider } from './components/layout/AccessibilityProvider';
import { BetSlipProvider } from './contexts/BetSlipContext';
import { BankrollProvider } from './contexts/BankrollContext';
import { FilterProvider } from './contexts/FilterContext';
import { ToastProvider } from './components/common/Toast';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { ThemeProvider } from './contexts/ThemeContext';
import { registerServiceWorker } from './utils/bundleOptimization';
import { initBrowserCompat } from './utils/browserCompat';
import LoadingBar from "./components/common/LoadingBar";
import PrivateRoute from "./components/auth/PrivateRoute";
import QuotaModal from './components/modals/QuotaModal';

// Lazy-load heavy routes to reduce initial bundle size
const Landing = React.lazy(() => import('./pages/Landing'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const Login = React.lazy(() => import('./components/design12/LoginPageWrapper').then(m => ({ default: m.LoginPageWrapper })));
const SignUp = React.lazy(() => import('./components/design12/SignUpPageWrapper').then(m => ({ default: m.SignUpPageWrapper })));
const ForgotPassword = React.lazy(() => import('./components/design12/ForgotPasswordPageWrapper').then(m => ({ default: m.ForgotPasswordPageWrapper })));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const Terms = React.lazy(() => import('./components/design12/TermsWrapper').then(m => ({ default: m.TermsWrapper })));
const Privacy = React.lazy(() => import('./components/design12/PrivacyWrapper').then(m => ({ default: m.PrivacyWrapper })));
const Roadmap = React.lazy(() => import('./components/design12/RoadmapWrapper').then(m => ({ default: m.RoadmapWrapper })));
const Disclaimer = React.lazy(() => import('./components/design12/DisclaimerWrapper').then(m => ({ default: m.DisclaimerWrapper })));
const BillingSuccess = React.lazy(() => import('./pages/BillingSuccess'));
const Subscribe = React.lazy(() => import('./pages/Subscribe'));
const WelcomePage = React.lazy(() => import('./pages/WelcomePage'));

// Debug-only components — excluded from production bundle
const DebugPanel = process.env.NODE_ENV === 'development' ? require('./components/debug/DebugPanel').default : null;
const AuthDebug = process.env.NODE_ENV === 'development' ? require('./components/debug/AuthDebug').default : null;
import "./App.css";
import './styles/accessibility.css';
import './styles/browserCompat.css';
import './styles/responsive-mobile.css';

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const [quotaModal, setQuotaModal] = useState({ open: false, detail: null });
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  // Handle Supabase auth redirects with hash params (email confirmation, password recovery)
  // Supabase may redirect to root URL with hash params like #access_token=...&type=signup
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('error_description') || hash.includes('type='))) {
      // Redirect to auth callback page to handle the auth flow properly
      console.log('🔐 Detected auth hash params, redirecting to /auth/callback');
      window.location.href = `/auth/callback${hash}`;
    }
  }, []);

  // Global quota exceeded event listener
  useEffect(() => {
    const handleQuotaExceeded = (event) => {
      setQuotaModal({ open: true, detail: event.detail });
    };
    
    window.addEventListener("plangate", handleQuotaExceeded);
    return () => window.removeEventListener("plangate", handleQuotaExceeded);
  }, []);

  // Debug panel keyboard shortcut — development only
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugPanelOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Only redirect non-authenticated users from login-required pages to landing page
  const shouldRedirectToLanding = !user && (
    location.pathname === '/account' ||
    location.pathname === '/app' ||
    location.pathname === '/dashboard'
  );

  if (shouldRedirectToLanding) {
    return <Navigate to="/" replace />;
  }

  return (
    <React.Suspense
      fallback={
        <div className="loading-fallback">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      }
    >
      <div className="app">
        <div className="app-layout">
          <LoadingBar />
          <main className="main-content" id="main-content" tabIndex="-1">
            {process.env.NODE_ENV === 'development' && AuthDebug && <AuthDebug />}
            <Routes>
              <Route path="/" element={user ? <DashboardPage /> : <Landing />} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/app" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/welcome" element={<PrivateRoute><WelcomePage /></PrivateRoute>} />
              <Route path="/subscribe" element={<PrivateRoute><Subscribe /></PrivateRoute>} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/billing/success" element={<BillingSuccess />} />
              <Route path="/billing/cancel" element={<Navigate to="/dashboard?view=changePlan" replace />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Quota Exceeded Modal */}
          <QuotaModal 
            open={quotaModal.open} 
            detail={quotaModal.detail} 
            onClose={() => setQuotaModal({ open: false, detail: null })} 
          />
        </div>
      </div>

      {/* Debug Panel - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
      )}
    </React.Suspense>
  );
}

function App() {
  useEffect(() => {
    try {
      const el = document.body;
      Array.from(el.classList)
        .filter(c => c.startsWith("theme-"))
        .forEach(c => el.classList.remove(c));
      el.classList.add("theme-purple");
      
      // Initialize browser compatibility fixes
      initBrowserCompat();
      
      // Unregister any existing service workers to prevent forced refresh on tab switch
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister().then(() => {
              console.log('Service Worker unregistered');
            });
          });
        });
      }
      
      // Register service worker for caching
      registerServiceWorker();
    } catch {}
  }, []);
  
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BankrollProvider>
            <BetSlipProvider>
              <FilterProvider>
                <AccessibilityProvider>
                  <ToastProvider>
                    <ErrorBoundary>
                      <AppRoutes />
                    </ErrorBoundary>
                  </ToastProvider>
                </AccessibilityProvider>
              </FilterProvider>
            </BetSlipProvider>
          </BankrollProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
