import { useNavigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/SimpleAuth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still navigate even if sign out fails
      navigate('/');
    }
  };

  return (
    <ThemeProvider>
      <Dashboard onSignOut={handleSignOut} />
    </ThemeProvider>
  );
}
