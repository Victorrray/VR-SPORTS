// Debug component to show authentication status
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AuthDebug() {
  const { user, authLoading, isSupabaseEnabled } = useAuth();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Auth debug disabled for production
  return null;
}
