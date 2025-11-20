import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/SimpleAuth';
import { Hero } from '../components/design11/Hero';
import { Stats } from '../components/design11/Stats';
import { Features } from '../components/design11/Features';
import { Header } from '../components/design11/Header';
import { Bookmakers } from '../components/design11/Bookmakers';
import { HowItWorks } from '../components/design11/HowItWorks';
import { Pricing } from '../components/design11/Pricing';
import { FAQ } from '../components/design11/FAQ';
import { Footer } from '../components/design11/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleDashboardClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  return (
    <div className="min-h-screen bg-gray-900" id="top">
      <div className="relative">
        <Header 
          onLoginClick={handleLoginClick} 
          onSignUpClick={handleSignUpClick}
          onDashboardClick={handleDashboardClick}
          onRoadmapClick={handleRoadmapClick}
        />
        <Hero />
        <Stats />
        <Bookmakers />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}
