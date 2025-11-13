import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/landing/Hero';
import { Stats } from '../components/landing/Stats';
import { Features } from '../components/landing/Features';
import { Header } from '../components/landing/Header';
import { Bookmakers } from '../components/landing/Bookmakers';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Pricing } from '../components/landing/Pricing';
import { FAQ } from '../components/landing/FAQ';
import { Footer } from '../components/landing/Footer';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function Landing() {
  const navigate = useNavigate();

  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-900" id="top">
        <div className="relative">
          <Header 
            onLoginClick={handleLoginClick} 
            onSignUpClick={handleSignUpClick}
            onDashboardClick={handleDashboardClick}
            onRoadmapClick={handleRoadmapClick}
          />
          <Hero onGetStarted={handleSignUpClick} />
          <Stats />
          <Bookmakers />
          <Features />
          <HowItWorks onGetStarted={handleSignUpClick} />
          <Pricing onGetStarted={handleSignUpClick} />
          <FAQ />
          <Footer 
            onRoadmapClick={handleRoadmapClick}
            onPrivacyClick={handlePrivacyClick}
            onTermsClick={handleTermsClick}
            onDisclaimerClick={handleDisclaimerClick}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
