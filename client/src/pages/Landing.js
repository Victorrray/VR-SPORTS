import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHelmet from '../components/seo/SEOHelmet';
import { generateSchemaMarkup } from '../utils/seo';
import '../styles/figma-design-2.css';

// Components
import { Header } from '../components/landing/Header.tsx';
import { Hero } from '../components/landing/Hero.tsx';
import { Stats } from '../components/landing/Stats.tsx';
import { Features } from '../components/landing/Features.tsx';
import { Bookmakers } from '../components/landing/Bookmakers.tsx';
import { HowItWorks } from '../components/landing/HowItWorks.tsx';
import { Pricing } from '../components/landing/Pricing.tsx';
import { FAQ } from '../components/landing/FAQ.tsx';
import { Footer } from '../components/landing/Footer.tsx';
import { MaintenanceGate } from '../components/landing/MaintenanceGate';

// Landing Page Component for non-authenticated users
export default function Landing() {
  const navigate = useNavigate();
  const organizationSchema = generateSchemaMarkup('Organization');

  // Navigation callbacks for Design.7 components
  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  const landingContent = (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <SEOHelmet
        title="OddSightSeer — Find +EV Bets & Compare Sportsbook Odds"
        description="Find +EV bets with real-time odds comparison across 39+ major sportsbooks. Spot arbitrage opportunities, track line movement, and maximize your betting edge."
        path="/"
        type="website"
        schema={organizationSchema}
      />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
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

  return (
    <MaintenanceGate>
      {landingContent}
    </MaintenanceGate>
  );
}
