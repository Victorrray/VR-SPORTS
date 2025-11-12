import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/design8/Dashboard';

export default function Design8Dashboard() {
  const navigate = useNavigate();
  
  const handleSignOut = () => {
    // Sign out logic will be handled by auth context
    navigate('/');
  };
  
  return <Dashboard onSignOut={handleSignOut} />;
}
