import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🔐 PrivateRoute:', { user: !!user, loading, userEmail: user?.email });

  if (loading) {
    console.log('🔐 PrivateRoute: Still loading auth...');
    return (
      <div className="loading-fallback">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔐 PrivateRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('🔐 PrivateRoute: User authenticated, rendering children');
  return children;
};

export default PrivateRoute;
