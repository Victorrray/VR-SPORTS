// file: src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AccessibilityProvider } from './components/layout/AccessibilityProvider';
import { BetSlipProvider } from './contexts/BetSlipContext';
import { ToastProvider } from './components/common/Toast';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import SkipToContent from './components/layout/SkipToContent';
import AuthDebug from './components/debug/AuthDebug';
import { registerServiceWorker } from './utils/bundleOptimization';
import Navbar from './components/layout/Navbar';
import MobileBottomBar from './components/layout/MobileBottomBar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import SportsbookMarkets from './pages/SportsbookMarkets';
import Login from './pages/Login';
import Account from './pages/Account';
import UsagePlan from './pages/UsagePlan';
import MySportsbooks from './pages/MySportsbooks';
import AuthCallback from './pages/AuthCallback';
import LoadingBar from "./components/common/LoadingBar";
import PrivateRoute from "./components/auth/PrivateRoute";
import PlanGuard from "./components/auth/PlanGuard";
import MyPicks from './pages/MyPicks';
import Scores from './pages/Scores';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import BillingSuccess from './pages/BillingSuccess';
import BillingCancel from './pages/BillingCancel';
import QuotaModal from './components/modals/QuotaModal';
import UsernameSetup from './components/auth/UsernameSetup';
import { initBrowserCompat } from "./utils/browserCompat";
import "./App.css";
import './styles/accessibility.css';
import './styles/browserCompat.css';
import './styles/responsive-mobile.css';

function AppRoutes() {
  const { user, planNotice, clearPlanNotice, planInfo } = useAuth();
  const location = useLocation();
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [quotaModal, setQuotaModal] = useState({ open: false, detail: null });
  const [mobileSearchCallback, setMobileSearchCallback] = useState(null);

  // Clear mobile search callback when navigating away from sportsbooks
  useEffect(() => {
    if (!location.pathname.startsWith('/sportsbooks')) {
      setMobileSearchCallback(null);
    }
  }, [location.pathname]);

  // Global quota exceeded event listener
  useEffect(() => {
    const handleQuotaExceeded = (event) => {
      setQuotaModal({ open: true, detail: event.detail });
    };
    
    window.addEventListener("plangate", handleQuotaExceeded);
    return () => window.removeEventListener("plangate", handleQuotaExceeded);
  }, []);

  // Debug logging for callback state
  useEffect(() => {
    console.log('App: mobileSearchCallback changed:', mobileSearchCallback);
  }, [mobileSearchCallback]);

  useEffect(() => {
    if (user && !user.user_metadata?.username) {
      setShowUsernameSetup(true);
    } else {
      setShowUsernameSetup(false);
    }
  }, [user]);

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
          <Navbar onOpenMobileSearch={() => {
            console.log('Navbar: onOpenMobileSearch called, callback exists:', !!mobileSearchCallback);
            if (mobileSearchCallback) {
              mobileSearchCallback();
            }
          }} />
          <main className="main-content" id="main-content" tabIndex="-1">
            {planNotice && (
              <div className={`plan-notice-banner ${planInfo?.plan === 'platinum' ? 'plan-notice-upgrade' : 'plan-notice-downgrade'}`}>
                <span>{planNotice}</span>
                <button type="button" onClick={clearPlanNotice} aria-label="Dismiss plan notice">×</button>
              </div>
            )}
            <AuthDebug />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sportsbooks" element={<PrivateRoute><SportsbookMarkets onRegisterMobileSearch={setMobileSearchCallback} /></PrivateRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/app" element={user ? <Navigate to="/sportsbooks" replace /> : <Navigate to="/login" replace />} />
              <Route path="/dashboard" element={user ? <Navigate to="/scores" replace /> : <Navigate to="/login" replace />} />
              <Route path="/pricing" element={<Home />} />
              <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
              <Route path="/usage-plan" element={<PrivateRoute><UsagePlan /></PrivateRoute>} />
              <Route path="/my-sportsbooks" element={<PrivateRoute><MySportsbooks /></PrivateRoute>} />
              <Route path="/picks" element={<PrivateRoute><MyPicks /></PrivateRoute>} />
              <Route path="/scores" element={<Scores />} />
              <Route path="/billing/success" element={<BillingSuccess />} />
              <Route path="/billing/cancel" element={<BillingCancel />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {/* Show footer on public landing routes */}
          {['/', '/home', '/pricing', '/login'].includes(location.pathname) && <Footer />}
          
          {/* Username Setup Modal */}
          {showUsernameSetup && (
            <UsernameSetup 
              onComplete={() => setShowUsernameSetup(false)} 
            />
          )}
          
          {/* Quota Exceeded Modal */}
          <QuotaModal 
            open={quotaModal.open} 
            detail={quotaModal.detail} 
            onClose={() => setQuotaModal({ open: false, detail: null })} 
          />
          
          {/* Mobile bottom bar is handled by individual pages */}
        </div>
      </div>
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
      
      // Register service worker for caching
      registerServiceWorker();
    } catch {}
  }, []);
  
  return (
    <HelmetProvider>
      <AuthProvider>
        <BetSlipProvider>
          <AccessibilityProvider>
            <ToastProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </ToastProvider>
          </AccessibilityProvider>
        </BetSlipProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
