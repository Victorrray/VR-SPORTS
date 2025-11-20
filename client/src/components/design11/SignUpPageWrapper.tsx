import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/SimpleAuth';
import { SignUpPage } from './SignUpPage';
import { toast } from 'sonner';

export function SignUpPageWrapper() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signUp(email, password);
      toast.success('Sign up successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Sign up failed. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignUpPage
      onBack={() => navigate('/')}
      onLogin={() => navigate('/login')}
      onSignUp={handleSignUp}
      isLoading={loading}
    />
  );
}
