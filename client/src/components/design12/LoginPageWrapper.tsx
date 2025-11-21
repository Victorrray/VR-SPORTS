import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginPage } from './LoginPage';

export function LoginPageWrapper() {
  const navigate = useNavigate();

  return (
    <LoginPage
      onBack={() => navigate('/')}
      onSignUp={() => navigate('/signup')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
}

export default LoginPageWrapper;
