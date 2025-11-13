import { useNavigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      <Dashboard onSignOut={() => navigate('/')} />
    </ThemeProvider>
  );
}
