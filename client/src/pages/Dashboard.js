import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/SimpleAuth';
import { Dashboard } from '../components/landing/Dashboard.tsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return <Dashboard onSignOut={handleSignOut} />;
}
