import { useNavigate } from 'react-router-dom';
import { Disclaimer as DisclaimerComponent } from '../pages/legal/Disclaimer';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function Disclaimer() {
  const navigate = useNavigate();

  const handleLoginClick = () => navigate('/login');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  return (
    <ThemeProvider>
      <DisclaimerComponent 
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
