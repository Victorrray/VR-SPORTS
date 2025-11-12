import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHelmet from '../components/seo/SEOHelmet';
import { generateSchemaMarkup } from '../utils/seo';
import '../styles/design8.css';

// Design.8 Components - using .tsx files directly
import { Header } from '../components/design8/Header.tsx';
import { Hero } from '../components/design8/Hero.tsx';
import { Stats } from '../components/design8/Stats.tsx';
import { Features } from '../components/design8/Features.tsx';
import { Bookmakers } from '../components/design8/Bookmakers.tsx';
import { HowItWorks } from '../components/design8/HowItWorks.tsx';
import { Pricing } from '../components/design8/Pricing.tsx';
import { FAQ } from '../components/design8/FAQ.tsx';
import { Footer } from '../components/design8/Footer.tsx';

// Landing Page Component for non-authenticated users
export default function Landing() {
  const navigate = useNavigate();
  const organizationSchema = generateSchemaMarkup('Organization');

  // Navigation callbacks for Design.8 components
  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  return (
    <div className="min-h-screen bg-gray-900" id="top">
      <SEOHelmet
        title="OddSightSeer — Find +EV Bets & Compare Sportsbook Odds"
        description="Find +EV bets with real-time odds comparison across 39+ major sportsbooks. Spot arbitrage opportunities, track line movement, and maximize your betting edge."
        path="/"
        type="website"
        schema={organizationSchema}
      />
      <div className="relative">
        <Header 
          onLoginClick={handleLoginClick}
          onDashboardClick={handleDashboardClick}
          onSignUpClick={handleSignUpClick}
          onRoadmapClick={handleRoadmapClick}
        />
        <Hero />
        <Stats />
        <Bookmakers />
        <Features />
        <HowItWorks />
        <Pricing onLoginClick={handleLoginClick} />
        <FAQ />
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
