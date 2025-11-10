import React from 'react';
import SEOHelmet from '../components/seo/SEOHelmet';
import { generateSchemaMarkup } from '../utils/seo';
import '../styles/landing-globals.css';

// Components
import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/HeroSection';
import { Stats } from '../components/landing/Stats';
import { Features } from '../components/landing/Features';
import { Bookmakers } from '../components/landing/Bookmakers';
import { HowItWorks } from '../components/landing/HowItWorks';
import { PricingSection } from '../components/landing/PricingSection';
import { Footer } from '../components/landing/Footer';

// Landing Page Component for non-authenticated users
export default function Landing() {
  const organizationSchema = generateSchemaMarkup('Organization');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <SEOHelmet
        title="OddSightSeer — Find +EV Bets & Compare Sportsbook Odds"
        description="Find +EV bets with real-time odds comparison across 15+ major sportsbooks. Spot arbitrage opportunities, track line movement, and maximize your betting edge."
        path="/"
        type="website"
        schema={organizationSchema}
      />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <div className="relative">
        <Header />
        <Hero />
        <Stats />
        <Bookmakers />
        <Features />
        <HowItWorks />
        <PricingSection />
        <Footer />
      </div>
    </div>
  );
}
