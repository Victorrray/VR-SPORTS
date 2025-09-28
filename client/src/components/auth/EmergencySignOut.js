// src/components/auth/EmergencySignOut.js
import React, { useState } from 'react';

/**
 * Emergency Sign Out component that works even when the authentication system is broken
 * This is a last resort when normal sign-out doesn't work
 */
const EmergencySignOut = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleEmergencySignOut = () => {
    setIsSigningOut(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log('🚨 Emergency sign out: Starting process...');
      
      // 1. Clear all localStorage items
      console.log('🚨 Emergency sign out: Clearing localStorage...');
      localStorage.clear();
      
      // 2. Clear all sessionStorage items
      console.log('🚨 Emergency sign out: Clearing sessionStorage...');
      sessionStorage.clear();
      
      // 3. Clear all cookies related to authentication
      console.log('🚨 Emergency sign out: Clearing cookies...');
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      });
      
      // 4. Set success state
      setSuccess(true);
      console.log('🚨 Emergency sign out: Storage cleared successfully');
      
      // 5. Redirect to login page after a brief delay
      setTimeout(() => {
        console.log('🚨 Emergency sign out: Redirecting to login page...');
        window.location.href = '/login?emergency_signout=true';
      }, 1500);
    } catch (err) {
      console.error('🚨 Emergency sign out error:', err);
      setError(err.message || 'An unknown error occurred');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="emergency-signout">
      {!success ? (
        <button 
          className="emergency-signout-button"
          onClick={handleEmergencySignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing Out...' : '🚨 Emergency Sign Out'}
        </button>
      ) : (
        <div className="emergency-signout-success">
          <p>Successfully signed out! Redirecting...</p>
        </div>
      )}
      
      {error && (
        <div className="emergency-signout-error">
          <p>Error: {error}</p>
          <p>Please try closing your browser completely and reopening it.</p>
        </div>
      )}
      
      <style jsx>{`
        .emergency-signout {
          margin-top: 20px;
          text-align: center;
        }
        
        .emergency-signout-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .emergency-signout-button:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-2px);
        }
        
        .emergency-signout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .emergency-signout-success {
          color: #10b981;
          font-weight: 600;
          padding: 10px;
        }
        
        .emergency-signout-error {
          margin-top: 10px;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          padding: 10px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default EmergencySignOut;
