/**
 * SEO Utility Functions
 * Provides structured data, meta tags, and SEO helpers
 */

export const SITE_CONFIG = {
  name: 'OddSightSeer',
  domain: 'https://oddsightseer.com',
  description: 'Free odds comparison tool to find the best NFL, NBA & MLB lines. Compare DraftKings vs FanDuel odds, find +EV player props, and shop lines across 15+ sportsbooks.',
  keywords: 'DraftKings vs FanDuel odds, best NFL betting odds today, NBA player props comparison, free odds comparison tool, PrizePicks vs Underdog lines, best sportsbook for NFL, line shopping tool free, positive EV bets finder, NFL spreads comparison, NBA totals best odds, MLB moneyline comparison, same game parlay odds, live betting odds comparison, best odds for Super Bowl, March Madness betting odds',
  twitterHandle: '@OddSightSeer',
  ogImage: 'https://oddsightseer.com/og-image.png',
  ogImageAlt: 'OddSightSeer - Real-time sports betting odds comparison across 15+ sportsbooks',
  logo: 'https://oddsightseer.com/og-image.png'
};

/**
 * Generate structured data for JSON-LD
 */
export const generateSchemaMarkup = (type, data = {}) => {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.domain,
    logo: SITE_CONFIG.logo,
    description: SITE_CONFIG.description,
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseSchema,
        '@type': 'Organization',
        sameAs: [
          'https://twitter.com/OddSightSeer',
          'https://www.facebook.com/OddSightSeer'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          url: 'https://oddsightseer.com/contact'
        }
      };

    case 'WebApplication':
      return {
        ...baseSchema,
        '@type': 'WebApplication',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free tier available with premium options'
        },
        featureList: [
          'Real-time odds comparison',
          '15+ sportsbooks',
          'Arbitrage detection',
          'Player props analysis',
          'Line movement tracking'
        ]
      };

    case 'BreadcrumbList':
      return {
        ...baseSchema,
        '@type': 'BreadcrumbList',
        itemListElement: data.items || []
      };

    case 'FAQPage':
      return {
        ...baseSchema,
        '@type': 'FAQPage',
        mainEntity: data.faqs || []
      };

    case 'Article':
      return {
        ...baseSchema,
        '@type': 'Article',
        headline: data.title || '',
        description: data.description || '',
        image: data.image || SITE_CONFIG.ogImage,
        datePublished: data.datePublished || new Date().toISOString(),
        author: {
          '@type': 'Organization',
          name: SITE_CONFIG.name
        }
      };

    case 'Product':
      return {
        ...baseSchema,
        '@type': 'Product',
        name: data.name || SITE_CONFIG.name,
        description: data.description || SITE_CONFIG.description,
        image: data.image || SITE_CONFIG.ogImage,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: data.lowPrice || '0',
          highPrice: data.highPrice || '99',
          offerCount: data.offerCount || 2
        }
      };

    case 'Service':
      return {
        ...baseSchema,
        '@type': 'Service',
        name: data.name || SITE_CONFIG.name,
        description: data.description || SITE_CONFIG.description,
        provider: {
          '@type': 'Organization',
          name: SITE_CONFIG.name,
          url: SITE_CONFIG.domain
        },
        areaServed: 'US',
        availableLanguage: 'en'
      };

    case 'SoftwareApplication':
      return {
        ...baseSchema,
        '@type': 'SoftwareApplication',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: data.features || [
          'Real-time odds comparison',
          'Arbitrage detection',
          'Player props analysis',
          'Line movement tracking'
        ]
      };

    default:
      return baseSchema;
  }
};

/**
 * Generate breadcrumb schema
 */
export const generateBreadcrumbs = (items) => {
  const breadcrumbItems = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: `${SITE_CONFIG.domain}${item.url}`
  }));

  return generateSchemaMarkup('BreadcrumbList', { items: breadcrumbItems });
};

/**
 * Generate FAQ schema
 */
export const generateFAQSchema = (faqs) => {
  const faqItems = faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }));

  return generateSchemaMarkup('FAQPage', { faqs: faqItems });
};

/**
 * Generate Open Graph meta tags object
 */
export const generateOGTags = (config = {}) => {
  return {
    'og:type': config.type || 'website',
    'og:title': config.title || SITE_CONFIG.name,
    'og:description': config.description || SITE_CONFIG.description,
    'og:image': config.image || SITE_CONFIG.ogImage,
    'og:url': config.url || SITE_CONFIG.domain,
    'og:site_name': SITE_CONFIG.name
  };
};

/**
 * Generate Twitter Card meta tags object
 */
export const generateTwitterTags = (config = {}) => {
  return {
    'twitter:card': config.card || 'summary_large_image',
    'twitter:title': config.title || SITE_CONFIG.name,
    'twitter:description': config.description || SITE_CONFIG.description,
    'twitter:image': config.image || SITE_CONFIG.ogImage,
    'twitter:site': SITE_CONFIG.twitterHandle,
    'twitter:creator': config.creator || SITE_CONFIG.twitterHandle
  };
};

/**
 * Generate canonical URL
 */
export const getCanonicalUrl = (path = '') => {
  return `${SITE_CONFIG.domain}${path}`;
};

/**
 * Generate sitemap entry
 */
export const generateSitemapEntry = (path, priority = 0.8, changefreq = 'weekly') => {
  return {
    url: getCanonicalUrl(path),
    priority,
    changefreq,
    lastmod: new Date().toISOString().split('T')[0]
  };
};

/**
 * SEO-friendly page titles (50-60 chars optimal)
 * Targeting long-tail keywords with search intent
 */
export const PAGE_TITLES = {
  home: 'Free Odds Comparison Tool — DraftKings vs FanDuel & More',
  sportsbooks: 'Compare NFL, NBA & MLB Odds — Best Lines Across 15+ Books',
  dashboard: 'Betting Tracker — ROI Analytics & +EV Bet Finder',
  scores: 'Live NFL, NBA, MLB Scores — Real-Time with Betting Odds',
  picks: 'Bet Tracker — Track Your Picks & Analyze Performance',
  dfs: 'PrizePicks vs Underdog — Compare DFS Player Props Lines',
  account: 'Account Settings — OddSightSeer',
  pricing: 'Pricing — Free Odds Comparison & Premium Features',
  terms: 'Terms of Service — OddSightSeer',
  privacy: 'Privacy Policy — OddSightSeer',
  login: 'Login — OddSightSeer Odds Comparison',
  signup: 'Sign Up Free — Compare Odds & Find +EV Bets',
  roadmap: 'Product Roadmap — OddSightSeer',
  disclaimer: 'Disclaimer — OddSightSeer'
};

/**
 * SEO-friendly page descriptions (150-160 chars optimal for SERP display)
 * Focus on long-tail keywords and clear value proposition
 */
export const PAGE_DESCRIPTIONS = {
  home: 'Free tool to compare DraftKings, FanDuel, BetMGM & 12+ sportsbook odds. Find the best NFL, NBA, MLB lines and +EV player props in seconds.',
  sportsbooks: 'Compare NFL spreads, NBA totals, MLB moneylines across DraftKings vs FanDuel vs BetMGM. See which book has the best odds for every game today.',
  dashboard: 'Track your betting ROI, see your win rate by sport, and get personalized +EV bet recommendations based on your betting history.',
  scores: 'Live NFL, NBA, MLB, NHL scores with real-time odds. See how lines move during games and find live betting value.',
  picks: 'Track all your bets in one place. See your ROI by sport, book, and bet type. Identify what\'s working and improve your strategy.',
  dfs: 'Compare PrizePicks vs Underdog Fantasy vs DraftKings Pick6 player prop lines. Find the best odds for points, rebounds, yards & more.',
  account: 'Manage your OddSightSeer account settings, connected sportsbooks, and notification preferences.',
  pricing: 'Free odds comparison for casual bettors. Upgrade to Platinum for unlimited access, arbitrage alerts, and advanced analytics.',
  terms: 'Terms of Service for OddSightSeer sports betting odds comparison platform.',
  privacy: 'Privacy Policy — How OddSightSeer protects your data and respects your privacy.',
  login: 'Log in to OddSightSeer to access your betting dashboard, saved picks, and personalized odds comparison.',
  signup: 'Create a free account to compare odds across 15+ sportsbooks, track your bets, and find +EV opportunities.',
  roadmap: 'See what features are coming next to OddSightSeer — arbitrage scanner, more sportsbooks, and advanced analytics.',
  disclaimer: 'Important legal disclaimer for OddSightSeer users regarding sports betting odds comparison.'
};

/**
 * Generate robots meta tag
 */
export const getRobotsMeta = (isPublic = true) => {
  return isPublic ? 'index, follow' : 'noindex, nofollow';
};

/**
 * Generate language alternate links
 */
export const generateLanguageAlternates = (path = '/') => {
  return [
    { hrefLang: 'en', href: `${SITE_CONFIG.domain}${path}` },
    { hrefLang: 'x-default', href: `${SITE_CONFIG.domain}${path}` }
  ];
};

/**
 * Preload critical resources for performance
 */
export const getCriticalResourcePreloads = () => {
  return [
    { rel: 'preload', as: 'font', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', crossOrigin: true },
    { rel: 'dns-prefetch', href: 'https://api.oddsightseer.com' },
    { rel: 'preconnect', href: 'https://api.oddsightseer.com' }
  ];
};

/**
 * Generate meta robots for specific pages
 */
export const getPageRobotsMeta = (page) => {
  const noIndexPages = ['/auth/callback', '/billing/success', '/billing/cancel'];
  return noIndexPages.includes(page) ? 'noindex, nofollow' : 'index, follow';
};
