// file: src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/SimpleAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AccessibilityProvider } from './components/layout/AccessibilityProvider';
import { BetSlipProvider } from './contexts/BetSlipContext';
import { ToastProvider } from './components/common/Toast';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { ThemeProvider } from './components/providers/ThemeProvider';
import AuthDebug from './components/debug/AuthDebug';
import { registerServiceWorker } from './utils/bundleOptimization';
import { initBrowserCompat } from './utils/browserCompat';
import DebugPanel from './components/debug/DebugPanel';
// import NavbarRevamped from './components/layout/NavbarRevamped'; // OLD - Using new Header from landing page
// import MobileBottomBar from './components/layout/MobileBottomBar'; // OLD - Not used with new landing page
// import Footer from './components/layout/Footer'; // OLD - Using new Footer from landing page
import Landing from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import DFSMarkets from './pages/DFSMarkets';
import SportsbookMarkets from './pages/SportsbookMarkets';
import Login from './pages/Login';
import Account from './pages/Account';
import UsagePlan from './pages/UsagePlan';
import MySportsbooks from './pages/MySportsbooks';
import AuthCallback from './pages/AuthCallback';
import LoadingBar from "./components/common/LoadingBar";
import PrivateRoute from "./components/auth/PrivateRoute";
import PlanGuard from "./components/guards/PlanGuard";
import MyPicks from './pages/MyPicks';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import BillingSuccess from './pages/BillingSuccess';
import BillingCancel from './pages/BillingCancel';
import Subscribe from './pages/Subscribe';
import QuotaModal from './components/modals/QuotaModal';
import UsernameSetup from './components/auth/UsernameSetup';
import "./App.css";
import './styles/accessibility.css';
import './styles/browserCompat.css';
import './styles/responsive-mobile.css';

// Wrapper for Dashboard to ensure it has ThemeProvider
function DashboardWrapper(props) {
  return <Dashboard {...props} />;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [quotaModal, setQuotaModal] = useState({ open: false, detail: null });
  const [mobileSearchCallback, setMobileSearchCallback] = useState(null);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

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

  // Debug panel keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugPanelOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Get profile from context
  const { profile } = useAuth();

  useEffect(() => {
    // Show username setup if user is logged in but has no username in profile
    if (user && profile && !profile.username) {
      setShowUsernameSetup(true);
    } else {
      setShowUsernameSetup(false);
    }
  }, [user, profile]);

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
          {/* OLD NAVBAR - Commented out, using new Header from landing page */}
          {/* <NavbarRevamped onOpenMobileSearch={() => {
            console.log('Navbar: onOpenMobileSearch called, callback exists:', !!mobileSearchCallback);
            if (mobileSearchCallback) {
              mobileSearchCallback();
            }
          }} /> */}
          <main className="main-content" id="main-content" tabIndex="-1">
            <AuthDebug />
            <Routes>
              <Route path="/" element={user ? <DashboardWrapper /> : <Landing />} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardWrapper /></PrivateRoute>} />
              <Route path="/dfs" element={<PrivateRoute><PlanGuard><DFSMarkets /></PlanGuard></PrivateRoute>} />
              <Route path="/sportsbooks" element={<PrivateRoute><SportsbookMarkets onRegisterMobileSearch={setMobileSearchCallback} /></PrivateRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/app" element={user ? <Navigate to="/sportsbooks" replace /> : <Navigate to="/login" replace />} />
              <Route path="/pricing" element={<Landing />} />
              <Route path="/subscribe" element={<PrivateRoute><Subscribe /></PrivateRoute>} />
              <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
              <Route path="/usage-plan" element={<PrivateRoute><UsagePlan /></PrivateRoute>} />
              <Route path="/my-sportsbooks" element={<PrivateRoute><MySportsbooks /></PrivateRoute>} />
              <Route path="/picks" element={<PrivateRoute><MyPicks /></PrivateRoute>} />
              <Route path="/billing/success" element={<BillingSuccess />} />
              <Route path="/billing/cancel" element={<BillingCancel />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {/* OLD FOOTER - Commented out, using new Footer from landing page */}
          {/* {(['/', '/pricing', '/signup'].includes(location.pathname) && !user) && <Footer />} */}
          
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
      
      // Register service worker for caching
      registerServiceWorker();
    } catch {}
  }, []);
  
  return (
    <HelmetProvider>
      <ThemeProvider>
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
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
