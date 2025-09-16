// file: src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import { BetSlipProvider } from './contexts/BetSlipContext';
import { ToastProvider } from './components/Toast';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import SkipToContent from './components/SkipToContent';
import AuthDebug from './components/AuthDebug';
import { registerServiceWorker } from './utils/bundleOptimization';
import Navbar from './components/Navbar';
import MobileBottomBar from './components/MobileBottomBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SportsbookMarkets from './pages/SportsbookMarkets';
import Login from './pages/Login';
import Account from './pages/Account';
import UsagePlan from './pages/UsagePlan';
import MySportsbooks from './pages/MySportsbooks';
import AuthCallback from './pages/AuthCallback';
import LoadingBar from "./components/LoadingBar";
import PrivateRoute from "./components/PrivateRoute";
import PlanGuard from "./components/PlanGuard";
import MyPicks from './pages/MyPicks';
import Scores from './pages/Scores';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import BillingSuccess from './pages/BillingSuccess';
import BillingCancel from './pages/BillingCancel';
import QuotaModal from './components/QuotaModal';
import UsernameSetup from './components/UsernameSetup';
import { initBrowserCompat } from "./utils/browserCompat";
import "./App.css";
import './styles/accessibility.css';
import './styles/browserCompat.css';
import './styles/responsive-mobile.css';

function AppRoutes() {
  const { user } = useAuth();
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
              <Route path="/account" element={<Account />} />
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
          {/* Only show footer on login page */}
          {location.pathname === "/login" && <Footer />}
          
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
