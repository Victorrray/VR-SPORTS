// src/components/common/ApiErrorDisplay.js
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Component to display API connection errors with helpful information
 */
const ApiErrorDisplay = ({ error, onRetry }) => {
  // Extract the most relevant part of the error message
  const getErrorMessage = () => {
    if (!error) return 'Unknown error';
    
    const errorStr = error.toString();
    
    // Check for common error types
    if (errorStr.includes('504')) {
      return 'Gateway Timeout (504) - The server took too long to respond';
    }
    if (errorStr.includes('502')) {
      return 'Bad Gateway (502) - The server is currently unavailable';
    }
    if (errorStr.includes('401')) {
      return 'Unauthorized (401) - Authentication required';
    }
    if (errorStr.includes('429')) {
      return 'Too Many Requests (429) - API rate limit exceeded';
    }
    if (errorStr.includes('proxy')) {
      return 'Proxy Error - Unable to connect to the API server';
    }
    
    // Return the original error if no specific match
    return errorStr;
  };

  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      margin: '20px auto',
      maxWidth: '800px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <AlertTriangle size={32} color="#ef4444" />
      </div>
      
      <h3 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '20px' }}>
        API Connection Error
      </h3>
      
      <p style={{ color: 'var(--text)', marginBottom: '12px' }}>
        Unable to connect to the odds API. This could be due to:
      </p>
      
      <ul style={{ 
        textAlign: 'left', 
        maxWidth: '500px', 
        margin: '0 auto', 
        color: 'var(--text-secondary)',
        marginBottom: '20px'
      }}>
        <li>Server is currently unavailable</li>
        <li>Network connectivity issues</li>
        <li>API rate limits have been reached</li>
      </ul>
      
      <div style={{
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        marginBottom: '20px',
        maxWidth: '600px',
        margin: '0 auto 20px auto',
        wordBreak: 'break-word',
        fontSize: '14px',
        color: 'var(--text-secondary)'
      }}>
        {getErrorMessage()}
      </div>
      
      <button 
        onClick={onRetry || (() => window.location.reload())}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <RefreshCw size={16} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
};

export default ApiErrorDisplay;
