// file: src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import AuthDebug from './components/debug/AuthDebug';
import { registerServiceWorker } from './utils/bundleOptimization';
import { initBrowserCompat } from './utils/browserCompat';
import DebugPanel from './components/debug/DebugPanel';
// import NavbarRevamped from './components/layout/NavbarRevamped'; // OLD - Using new Header from landing page
// import Footer from './components/layout/Footer'; // OLD - Using new Footer from landing page
import Landing from './pages/Landing';
import DashboardPage from './pages/DashboardPage';
import DFSMarkets from './pages/DFSMarkets';
import SportsbookMarkets from './pages/SportsbookMarkets';
import { OddsPageWrapper as OddsPage } from './components/design12/OddsPageWrapper';
import { LoginPageWrapper as Login } from './components/design12/LoginPageWrapper';
import { SignUpPageWrapper as SignUp } from './components/design12/SignUpPageWrapper';
import { ForgotPasswordPageWrapper as ForgotPassword } from './components/design12/ForgotPasswordPageWrapper';
import { AccountPageWrapper as Account } from './components/design12/AccountPageWrapper';
import UsagePlan from './pages/UsagePlan';
import MySportsbooks from './pages/MySportsbooks';
import AuthCallback from './pages/AuthCallback';
import LoadingBar from "./components/common/LoadingBar";
import PrivateRoute from "./components/auth/PrivateRoute";
import PlanGuard from "./components/guards/PlanGuard";
import { PicksPage as MyPicks } from './components/design12/PicksPage';
import { TermsWrapper as Terms } from './components/design12/TermsWrapper';
import { PrivacyWrapper as Privacy } from './components/design12/PrivacyWrapper';
import { RoadmapWrapper as Roadmap } from './components/design12/RoadmapWrapper';
import { DisclaimerWrapper as Disclaimer } from './components/design12/DisclaimerWrapper';
import BillingSuccess from './pages/BillingSuccess';
import BillingCancel from './pages/BillingCancel';
import Subscribe from './pages/Subscribe';
import QuotaModal from './components/modals/QuotaModal';
import UsernameSetup from './components/auth/UsernameSetup';
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
              <Route path="/" element={user ? <DashboardPage /> : <Landing />} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              {/* <Route path="/dfs" element={<PrivateRoute><PlanGuard><DFSMarkets /></PlanGuard></PrivateRoute>} /> */}
              {/* /sportsbooks route removed - old page */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/app" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
              {/* <Route path="/pricing" element={<Landing />} /> */}
              <Route path="/subscribe" element={<PrivateRoute><Subscribe /></PrivateRoute>} />
              {/* <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} /> */}
              {/* <Route path="/usage-plan" element={<PrivateRoute><UsagePlan /></PrivateRoute>} /> */}
              {/* <Route path="/my-sportsbooks" element={<PrivateRoute><MySportsbooks /></PrivateRoute>} /> */}
              {/* /picks route hidden for free version */}
              {/* <Route path="/picks" element={<PrivateRoute><MyPicks /></PrivateRoute>} /> */}
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/billing/success" element={<BillingSuccess />} />
              <Route path="/billing/cancel" element={<Navigate to="/dashboard?view=changePlan" replace />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
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
