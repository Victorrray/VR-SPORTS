// file: src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import { BetSlipProvider } from './contexts/BetSlipContext';
import { ToastProvider } from './components/Toast';
import { HelmetProvider } from 'react-helmet-async';
import SkipToContent from './components/SkipToContent';
import AccessibilityMenu from './components/AccessibilityMenu';
import { registerServiceWorker } from './utils/bundleOptimization';
import Navbar from './components/Navbar';
import MobileBottomBar from './components/MobileBottomBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SportsbookMarkets from './pages/SportsbookMarkets';
import Login from './pages/Login';
import Account from './pages/Account';
import UsernameSetup from './components/UsernameSetup';
import LoadingBar from "./components/LoadingBar";
import PrivateRoute from "./auth/PrivateRoute";
import MyPicks from './pages/MyPicks';
import Scores from './pages/Scores';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { useAuth } from "./auth/AuthProvider";
import { initBrowserCompat } from "./utils/browserCompat";
import "./App.css";
import './styles/accessibility.css';
import './styles/browserCompat.css';
import './styles/responsive-mobile.css';

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);

  useEffect(() => {
    if (user && !user.user_metadata?.username) {
      setShowUsernameSetup(true);
    } else {
      setShowUsernameSetup(false);
    }
  }, [user]);

  // Redirect non-authenticated users from protected pages to landing page
  const shouldRedirectToLanding = !user && (
    location.pathname === '/sportsbooks' ||
    location.pathname === '/scores' ||
    location.pathname === '/picks' ||
    location.pathname === '/account'
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
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div className="app-layout">
          <SkipToContent />
          <LoadingBar />
          <Navbar />
          <main className="main-content" id="main-content" tabIndex="-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sportsbooks" element={user ? <SportsbookMarkets /> : <Navigate to="/" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
              <Route path="/picks" element={<PrivateRoute><MyPicks /></PrivateRoute>} />
              <Route path="/scores" element={user ? <Scores /> : <Navigate to="/" replace />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {/* Only show footer on landing and login pages */}
          {(location.pathname === "/" || location.pathname === "/login") && <Footer />}
          
          {/* Username Setup Modal */}
          {showUsernameSetup && (
            <UsernameSetup onComplete={() => setShowUsernameSetup(false)} />
          )}
          
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
