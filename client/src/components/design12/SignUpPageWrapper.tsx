import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUpPage } from './SignUpPage';

export function SignUpPageWrapper() {
  const navigate = useNavigate();

  return (
    <SignUpPage
      onBack={() => navigate('/')}
      onLogin={() => navigate('/login')}
    />
  );
}

export default SignUpPageWrapper;
