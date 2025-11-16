import { useNavigate } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function Login() {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      <LoginPage 
        onBack={() => navigate('/')}
        onSignUp={() => navigate('/signup')}
        onForgotPassword={() => navigate('/forgot-password')}
      />
    </ThemeProvider>
  );
}
