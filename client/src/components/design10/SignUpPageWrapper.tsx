import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/SimpleAuth';
import { SignUpPage } from './SignUpPage';
import { toast } from 'sonner';

export function SignUpPageWrapper() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await signUp(email, password, name);
      toast.success('Account created successfully!');
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
      onTerms={() => navigate('/terms')}
      onPrivacy={() => navigate('/privacy')}
      onGoogleSignUp={() => {
        toast.info('Google sign up coming soon!');
      }}
    />
  );
}
