// DEPRECATED: This file has been split into Landing.js and Dashboard.js
// This file is kept for backward compatibility but should not be used
// Use Landing.js for non-authenticated users and Dashboard.js for authenticated users

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  
  // Redirect to appropriate component based on auth state
  return <Navigate to="/" replace />;
}
