import { useNavigate } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      <ForgotPasswordPage 
        onBack={() => navigate('/login')}
      />
    </ThemeProvider>
  );
}
