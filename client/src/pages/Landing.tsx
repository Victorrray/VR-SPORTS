import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/SimpleAuth';
import { Hero } from '../components/design12/Hero';
import { Stats } from '../components/design12/Stats';
import { Features } from '../components/design12/Features';
import { Header } from '../components/design12/Header';
import { Bookmakers } from '../components/design12/Bookmakers';
import { HowItWorks } from '../components/design12/HowItWorks';
import { Pricing } from '../components/design12/Pricing';
import { FAQ } from '../components/design12/FAQ';
import { Footer } from '../components/design12/Footer';

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
