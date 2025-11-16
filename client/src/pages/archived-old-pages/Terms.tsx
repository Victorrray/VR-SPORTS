import { useNavigate } from 'react-router-dom';
import { Terms as TermsComponent } from '../pages/legal/Terms';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function Terms() {
  const navigate = useNavigate();

  const handleLoginClick = () => navigate('/login');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  return (
    <ThemeProvider>
      <TermsComponent 
        onBack={() => navigate('/')}
        onLoginClick={handleLoginClick}
        onDashboardClick={handleDashboardClick}
        onSignUpClick={() => navigate('/signup')}
        onRoadmapClick={handleRoadmapClick}
        onPrivacyClick={handlePrivacyClick}
        onTermsClick={handleTermsClick}
        onDisclaimerClick={handleDisclaimerClick}
      />
    </ThemeProvider>
  );
}
