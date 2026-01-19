/**
 * SEO Utility Functions
 * Provides structured data, meta tags, and SEO helpers
 */

export const SITE_CONFIG = {
  name: 'OddSightSeer',
  domain: 'https://oddsightseer.com',
  description: 'Find +EV bets, compare sportsbook odds, and track line movement across 15+ major bookmakers.',
  keywords: 'sports betting odds, odds comparison tool, best sportsbook odds, +EV betting, positive expected value bets, arbitrage betting, line movement tracker, player props comparison, NFL odds, NBA odds, MLB odds, NHL odds, DraftKings odds, FanDuel odds, BetMGM odds, line shopping tool, betting edge finder, sports betting analytics, real-time odds, PrizePicks comparison, Underdog Fantasy odds',
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
 */
export const PAGE_TITLES = {
  home: 'OddSightSeer — Find +EV Bets & Compare Sportsbook Odds',
  sportsbooks: 'Best Odds Comparison — Compare 15+ Sportsbooks Real-Time',
  dashboard: 'Betting Dashboard — Track Performance & Find +EV Opportunities',
  scores: 'Live Sports Scores — Real-Time Updates with Betting Context',
  picks: 'My Picks — Betting History & Performance Analytics',
  dfs: 'DFS Odds Comparison — Daily Fantasy Sports Lines & Props',
  account: 'Account Settings — Manage Your Profile & Preferences',
  pricing: 'Pricing Plans — Choose Your OddSightSeer Tier',
  terms: 'Terms of Service — OddSightSeer',
  privacy: 'Privacy Policy — OddSightSeer',
  login: 'Login — Access Your OddSightSeer Account',
  signup: 'Sign Up Free — Start Finding +EV Bets Today',
  roadmap: 'Product Roadmap — OddSightSeer Future Features',
  disclaimer: 'Disclaimer — OddSightSeer Sports Betting Platform'
};

/**
 * SEO-friendly page descriptions (160-320 chars optimal)
 */
export const PAGE_DESCRIPTIONS = {
  home: 'Find +EV bets with real-time odds comparison across 15+ major sportsbooks. Spot arbitrage opportunities, track line movement, and maximize your betting edge with advanced analytics.',
  sportsbooks: 'Compare moneylines, spreads, totals, and props across DraftKings, FanDuel, BetMGM, Caesars, PointsBet, and more. Find the best odds instantly with real-time line tracking.',
  dashboard: 'Track your betting performance with detailed analytics, ROI tracking, and personalized high-edge bet recommendations. Monitor your bankroll and improve your betting strategy.',
  scores: 'Live sports scores for NFL, NBA, MLB, NHL, and more with real-time updates, betting context, and odds integration for informed betting decisions.',
  picks: 'Review your complete betting history, track performance metrics, analyze your picks with advanced analytics, and identify patterns to improve your ROI.',
  dfs: 'Compare daily fantasy sports odds across PrizePicks, Underdog Fantasy, and DraftKings Pick6. Find the best player prop lines for maximum value.',
  account: 'Manage your OddSightSeer account, update preferences, configure sportsbook selections, and customize your betting experience.',
  pricing: 'Choose the right OddSightSeer plan for your betting needs. Free tier with basic odds comparison or Platinum for unlimited access to all features.',
  terms: 'Read the complete terms of service for OddSightSeer sports betting odds comparison platform. Understand your rights and responsibilities.',
  privacy: 'Learn how OddSightSeer protects your privacy, handles your data, and complies with data protection regulations.',
  login: 'Log in to your OddSightSeer account to access real-time odds comparison, betting analytics, and personalized recommendations.',
  signup: 'Create a free OddSightSeer account to start comparing odds, finding +EV bets, and tracking your betting performance with advanced analytics.',
  roadmap: 'Explore OddSightSeer\'s product roadmap and upcoming features. See what\'s coming next to improve your sports betting experience.',
  disclaimer: 'Important disclaimer and legal information for OddSightSeer users. Please read before using our sports betting odds comparison platform.'
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
