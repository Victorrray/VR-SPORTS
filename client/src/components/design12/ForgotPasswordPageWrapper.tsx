import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';

export function ForgotPasswordPageWrapper() {
  const navigate = useNavigate();

  return (
    <ForgotPasswordPage
      onBack={() => navigate('/login')}
    />
  );
}

export default ForgotPasswordPageWrapper;
