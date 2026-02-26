import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/SimpleAuth';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Hero } from '../components/design12/Hero';
import { FreeOddsPreview } from '../components/design12/FreeOddsPreview';
import { Header } from '../components/design12/Header';
import { HowItWorks } from '../components/design12/HowItWorks';
import { FAQ } from '../components/design12/FAQ';
import { Footer } from '../components/design12/Footer';
import { PAGE_TITLES, PAGE_DESCRIPTIONS, generateSchemaMarkup, SITE_CONFIG } from '../utils/seo';

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
