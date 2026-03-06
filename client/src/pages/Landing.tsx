import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/SimpleAuth';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Hero } from '../components/design12/Hero';
import { FreeOddsPreview } from '../components/design12/FreeOddsPreview';
import { Header } from '../components/design12/Header';
import { HowItWorks } from '../components/design12/HowItWorks';
import { FAQ } from '../components/design12/FAQ';
import { Footer } from '../components/design12/Footer';
import { PAGE_TITLES, PAGE_DESCRIPTIONS, generateSchemaMarkup, generateFAQSchema, SITE_CONFIG } from '../utils/seo';

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
      <Helmet>
        <title>{PAGE_TITLES.home}</title>
        <meta name="description" content={PAGE_DESCRIPTIONS.home} />
        <meta name="keywords" content={SITE_CONFIG.keywords} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE_CONFIG.domain} />
        <meta property="og:title" content={PAGE_TITLES.home} />
        <meta property="og:description" content={PAGE_DESCRIPTIONS.home} />
        <meta property="og:image" content={SITE_CONFIG.ogImage} />
        <meta property="og:image:alt" content={SITE_CONFIG.ogImageAlt} />
        <meta property="og:url" content={SITE_CONFIG.domain} />
        <meta name="twitter:title" content={PAGE_TITLES.home} />
        <meta name="twitter:description" content={PAGE_DESCRIPTIONS.home} />
        <meta name="twitter:image" content={SITE_CONFIG.ogImage} />
        <script type="application/ld+json">
          {JSON.stringify(generateSchemaMarkup('Organization'))}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(generateFAQSchema([
            { question: 'Does OddSightSeer offer a free odds viewer?', answer: 'Yes! OddSightSeer offers a free odds viewer that gives you access to our Straight Bets tool. Compare real-time odds across multiple sportsbooks at no cost. Upgrade to Gold or Platinum for access to +EV finder, player props, arbitrage opportunities, and more advanced features.' },
            { question: 'Is OddSightSeer a sportsbook?', answer: 'No, OddSightSeer is not a sportsbook. We are strictly a sports data and analytics platform. We do not facilitate betting or hold user funds. We provide real-time odds data, +EV analysis, and betting tools to help you make informed decisions on the sportsbooks of your choice.' },
            { question: 'How does OddSightSeer find +EV bets?', answer: 'Our proprietary algorithm scans odds across 45+ sportsbooks in real-time, calculates true probability, and identifies bets where the implied odds are in your favor.' },
            { question: "What's the difference between Gold and Platinum?", answer: 'Gold ($10/mo) includes access to all 45+ sportsbooks, +EV finder, and player props tool. Platinum ($25/mo) adds arbitrage opportunities, middles tool, and live betting markets.' },
            { question: 'Can I cancel my subscription anytime?', answer: 'Yes! Both plans are month-to-month with no long-term commitment. You can cancel anytime from your account settings.' },
            { question: 'What sports and markets are covered?', answer: 'We cover all major sports including NFL, NBA, MLB, NHL, NCAA Basketball and football. Markets include moneylines, spreads, totals, player props, and live betting (Platinum plan).' },
          ]))}
        </script>
      </Helmet>
      <div className="relative">
        <Header 
          onLoginClick={handleLoginClick} 
          onDashboardClick={handleDashboardClick}
          onRoadmapClick={handleRoadmapClick}
          onSignupClick={handleSignUpClick}
        />
        <Hero onGetStartedClick={handleSignUpClick} />
        <FreeOddsPreview onGetStartedClick={handleSignUpClick} />
        <HowItWorks />
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
