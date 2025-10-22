/**
 * SEO Utility Functions
 * Provides structured data, meta tags, and SEO helpers
 */

export const SITE_CONFIG = {
  name: 'OddSightSeer',
  domain: 'https://oddsightseer.com',
  description: 'Find +EV bets, compare sportsbook odds, and track line movement across 15+ major bookmakers.',
  keywords: 'sports betting, odds comparison, sportsbooks, +EV bets, arbitrage, line movement, player props',
  twitterHandle: '@OddSightSeer',
  ogImage: 'https://oddsightseer.com/og-image.png',
  logo: 'https://oddsightseer.com/logo.png'
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
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free tier available'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '2000',
          bestRating: '5',
          worstRating: '1'
        }
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
 * SEO-friendly page titles
 */
export const PAGE_TITLES = {
  home: 'OddSightSeer — Find +EV Bets & Compare Sportsbook Odds',
  sportsbooks: 'Odds Comparison — Compare Lines Across 15+ Sportsbooks',
  dashboard: 'Your Betting Dashboard — Track Performance & Opportunities',
  scores: 'Live Sports Scores — Real-Time Updates with Betting Context',
  picks: 'My Picks — Betting History & Performance Analytics',
  dfs: 'DFS Odds Comparison — Daily Fantasy Sports Lines',
  account: 'Account Settings — Manage Your Profile & Preferences',
  pricing: 'Pricing Plans — Choose Your OddSightSeer Tier',
  terms: 'Terms of Service — OddSightSeer',
  privacy: 'Privacy Policy — OddSightSeer'
};

/**
 * SEO-friendly page descriptions
 */
export const PAGE_DESCRIPTIONS = {
  home: 'Find +EV bets with real-time odds comparison across 15+ major sportsbooks. Spot arbitrage opportunities, track line movement, and maximize your betting edge.',
  sportsbooks: 'Compare moneylines, spreads, totals, and props across DraftKings, FanDuel, BetMGM, Caesars, and more. Find the best odds instantly.',
  dashboard: 'Track your betting performance with detailed analytics, ROI tracking, and personalized high-edge bet recommendations.',
  scores: 'Live sports scores for NFL, NBA, MLB, NHL, and more with real-time updates and betting context.',
  picks: 'Review your betting history, track performance metrics, and analyze your picks with advanced analytics.',
  dfs: 'Compare daily fantasy sports odds across PrizePicks, Underdog Fantasy, and DraftKings Pick6.',
  account: 'Manage your OddSightSeer account, preferences, and subscription settings.',
  pricing: 'Choose the right OddSightSeer plan for your betting needs. Free tier or Platinum unlimited access.',
  terms: 'Read the terms of service for OddSightSeer sports betting odds comparison platform.',
  privacy: 'Learn how OddSightSeer protects your privacy and handles your data.'
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
