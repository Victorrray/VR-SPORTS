import { useNavigate } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Dashboard } from '../components/design12/Dashboard';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/SimpleAuth';
import { PAGE_TITLES, PAGE_DESCRIPTIONS, generateSchemaMarkup, SITE_CONFIG } from '../utils/seo';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still navigate even if sign out fails
      navigate('/');
    }
  };

  return (
    <ThemeProvider>
      <Helmet>
        <title>{PAGE_TITLES.dashboard}</title>
        <meta name="description" content={PAGE_DESCRIPTIONS.dashboard} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${SITE_CONFIG.domain}/dashboard`} />
        <meta property="og:title" content={PAGE_TITLES.dashboard} />
        <meta property="og:description" content={PAGE_DESCRIPTIONS.dashboard} />
        <script type="application/ld+json">
          {JSON.stringify(generateSchemaMarkup('WebApplication'))}
        </script>
      </Helmet>
      <Dashboard onSignOut={handleSignOut} />
    </ThemeProvider>
  );
}
