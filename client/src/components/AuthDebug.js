// Debug component to show authentication status
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthDebug() {
  const { user, loading, isSupabaseEnabled } = useAuth();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Auth Debug:</strong></div>
      <div>Supabase Enabled: {isSupabaseEnabled ? '✅' : '❌'}</div>
      <div>Loading: {loading ? '⏳' : '✅'}</div>
      <div>User: {user ? `✅ ${user.email}` : '❌ Not logged in'}</div>
      {!isSupabaseEnabled && (
        <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
          ⚠️ Supabase not configured - check environment variables
        </div>
      )}
    </div>
  );
}
