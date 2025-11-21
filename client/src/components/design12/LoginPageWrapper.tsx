import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';
import { LoginPage } from './LoginPage';
import { toast } from 'sonner';

export function LoginPageWrapper() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginPage
      onBack={() => navigate('/')}
      onSignUp={() => navigate('/signup')}
      onForgotPassword={() => navigate('/forgot-password')}
      onLogin={handleLogin}
      isLoading={loading}
    />
  );
}

export default LoginPageWrapper;
