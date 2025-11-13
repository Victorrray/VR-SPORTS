import { useNavigate } from 'react-router-dom';
import { SignUpPage } from './SignUpPage';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function SignUp() {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      <SignUpPage 
        onBack={() => navigate('/')}
        onLogin={() => navigate('/login')}
      />
    </ThemeProvider>
  );
}
