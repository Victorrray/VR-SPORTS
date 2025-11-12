import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHelmet from '../components/seo/SEOHelmet';
import '../styles/design8.css';

// Design.8 Components - using .tsx files directly
import { Header } from '../components/design8/Header.tsx';
import { Roadmap as RoadmapComponent } from '../components/design8/Roadmap.tsx';
import { Footer } from '../components/design8/Footer.tsx';

export default function Roadmap() {
  const navigate = useNavigate();

  // Navigation callbacks
  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  return (
    <div className="min-h-screen bg-gray-900">
      <SEOHelmet
        title="Roadmap — OddSightSeer"
        description="See what's coming next for OddSightSeer. Our product roadmap and upcoming features."
        path="/roadmap"
        type="website"
      />
      <div className="relative">
        <Header 
          onLoginClick={handleLoginClick}
          onDashboardClick={handleDashboardClick}
          onSignUpClick={handleSignUpClick}
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
    </div>
  );
}
