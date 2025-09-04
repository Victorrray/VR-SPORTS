// file: src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import { BetSlipProvider } from './contexts/BetSlipContext';
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
        <Navbar />
        <LoadingBar />
        <main id="main-content" className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sportsbooks" element={<SportsbookMarkets />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
            <Route path="/picks" element={<PrivateRoute><MyPicks /></PrivateRoute>} />
            <Route path="/scores" element={<Scores />} />
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
    </React.Suspense>
  );
}

export default function App() {
  React.useEffect(() => {
    try {
      const el = document.body;
      Array.from(el.classList)
        .filter(c => c.startsWith("theme-"))
        .forEach(c => el.classList.remove(c));
      el.classList.add("theme-purple");
      
      // Initialize browser compatibility fixes
      initBrowserCompat();
    } catch {}
  }, []);
  
  return (
    <AuthProvider>
      <BetSlipProvider>
        <AccessibilityProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AccessibilityProvider>
      </BetSlipProvider>
    </AuthProvider>
  );
}
