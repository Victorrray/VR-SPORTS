import { useNavigate } from 'react-router-dom';
import { Roadmap as RoadmapComponent } from '../pages/legal/Roadmap';
import { Header } from '../components/landing/Header';
import { Footer } from '../components/landing/Footer';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function Roadmap() {
  const navigate = useNavigate();

  const handleLoginClick = () => navigate('/login');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  return (
    <ThemeProvider>
      <div className="relative">
        <Header 
          onLoginClick={handleLoginClick} 
          onDashboardClick={handleDashboardClick}
          onRoadmapClick={handleRoadmapClick}
        />
        <RoadmapComponent />
        <Footer 
          onRoadmapClick={handleRoadmapClick}
          onPrivacyClick={handlePrivacyClick}
          onTermsClick={handleTermsClick}
          onDisclaimerClick={handleDisclaimerClick}
        />
      </div>
    </ThemeProvider>
  );
}
