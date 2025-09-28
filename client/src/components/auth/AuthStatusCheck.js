// src/components/auth/AuthStatusCheck.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMe } from '../../hooks/useMe';
import { supabase } from '../../lib/supabase';
import EmergencySignOut from './EmergencySignOut';
import './AuthStatusCheck.css';

/**
 * Component to check authentication status and display appropriate messages
 * Used to handle cases where a user might be partially authenticated or session is invalid
 */
const AuthStatusCheck = ({ onRetry }) => {
  const { user, signOut } = useAuth();
  const { me } = useMe();
  const navigate = useNavigate();
  const [sessionExpiry, setSessionExpiry] = useState(null);
  
  // Get session expiry time
  useEffect(() => {
    const getSessionExpiry = async () => {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.expires_at) {
            const expiryDate = new Date(data.session.expires_at * 1000);
            setSessionExpiry(expiryDate);
          }
        }
      } catch (error) {
        console.error('Error getting session expiry:', error);
      }
    };
    
    getSessionExpiry();
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('Attempting to sign out user...');
      
      // Use the enhanced sign out with force option
      try {
        await signOut({ 
          force: true, 
          scope: 'global', 
          clearStorage: true 
        });
        console.log('Sign out successful');
      } catch (error) {
        console.error('Sign out failed despite force option:', error);
      }
      
      // Clear any local storage items that might contain auth state
      try {
        console.log('Clearing local storage items...');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('userSelectedSportsbooks');
        localStorage.removeItem('pricingIntent');
        // Add any other auth-related items here
        
        // Clear session storage as well
        sessionStorage.clear();
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      // Always navigate to login page, even if the above steps fail
      console.log('Navigating to login page...');
      navigate('/login?auth_reset=true');
      
      // Force page reload as a last resort to clear any in-memory state
      setTimeout(() => {
        console.log('Forcing page reload...');
        window.location.href = '/login?auth_reset=true&force=true';
      }, 100);
    } catch (error) {
      console.error('Error in sign out process:', error);
      // Force navigation even if everything fails
      window.location.href = '/login?auth_error=true';
    }
  };

  const handleSignIn = () => {
    navigate('/login?return_to=' + encodeURIComponent(window.location.pathname));
  };

  return (
    <div className="auth-status-check">
      <div className="auth-status-icon">
        <AlertTriangle size={32} color="#f59e0b" />
      </div>
      
      <h2>Authentication Issue Detected</h2>
      
      <p className="auth-status-message">
        Your session appears to be invalid or incomplete. This can happen if:
      </p>
      
      <ul className="auth-status-reasons">
        <li>Your session has expired</li>
        <li>You're not fully signed in</li>
        <li>There was an error with authentication</li>
      </ul>
      
      <div className="auth-status-details">
        <div className="auth-status-item">
          <span className="auth-status-label">User ID:</span>
          <span className="auth-status-value">{user?.id || 'Not available'}</span>
        </div>
        <div className="auth-status-item">
          <span className="auth-status-label">Email:</span>
          <span className="auth-status-value">{user?.email || 'Not available'}</span>
        </div>
        <div className="auth-status-item">
          <span className="auth-status-label">Plan:</span>
          <span className="auth-status-value">{me?.plan || 'Not available'}</span>
        </div>
        <div className="auth-status-item">
          <span className="auth-status-label">Session Expires:</span>
          <span className="auth-status-value">
            {sessionExpiry ? sessionExpiry.toLocaleString() : 'Unknown'}
            {sessionExpiry && new Date() > sessionExpiry && ' (Expired)'}
          </span>
        </div>
      </div>
      
      <div className="auth-status-actions">
        <button 
          className="auth-action-button sign-in" 
          onClick={handleSignIn}
        >
          <LogIn size={16} />
          <span>Sign In Again</span>
        </button>
        
        {user && (
          <button 
            className="auth-action-button sign-out" 
            onClick={handleSignOut}
          >
            <LogIn size={16} />
            <span>Sign Out</span>
          </button>
        )}
        
        {onRetry && (
          <button 
            className="auth-action-button retry" 
            onClick={onRetry}
          >
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        )}
        
        {/* Emergency Sign Out option as a last resort */}
        <div className="auth-status-emergency">
          <p>If the above options don't work:</p>
          <EmergencySignOut />
        </div>
      </div>
    </div>
  );
};

export default AuthStatusCheck;
