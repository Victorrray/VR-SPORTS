import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import {
  SITE_CONFIG,
  PAGE_TITLES,
  PAGE_DESCRIPTIONS,
  generateOGTags,
  generateTwitterTags,
  generateSchemaMarkup,
  getCanonicalUrl,
  getPageRobotsMeta
} from '../../utils/seo';

/**
 * SEO Helmet Component
 * Handles all meta tags, structured data, and SEO elements for a page
 */
const SEOHelmet = ({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  schema,
  noindex = false,
  children
}) => {
  // Use provided values or fallback to defaults
  const pageTitle = title || PAGE_TITLES.home;
  const pageDescription = description || PAGE_DESCRIPTIONS.home;
  const pageImage = image || SITE_CONFIG.ogImage;
  const canonicalUrl = getCanonicalUrl(path);
  const robotsMeta = noindex ? 'noindex, nofollow' : getPageRobotsMeta(path);

  // Generate OG and Twitter tags
  const ogTags = generateOGTags({
    title: pageTitle,
    description: pageDescription,
    image: pageImage,
    url: canonicalUrl,
    type
  });

  const twitterTags = generateTwitterTags({
    title: pageTitle,
    description: pageDescription,
    image: pageImage
  });

  // Default schema if not provided
  const defaultSchema = schema || generateSchemaMarkup('WebApplication');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robotsMeta} />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#0f1220" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      {Object.entries(ogTags).map(([key, value]) => (
        <meta key={key} property={key} content={value} />
      ))}

      {/* Twitter Card Tags */}
      {Object.entries(twitterTags).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(defaultSchema)}
      </script>

      {/* Additional SEO Tags */}
      <meta name="keywords" content={SITE_CONFIG.keywords} />
      <meta name="author" content={SITE_CONFIG.name} />
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${SITE_CONFIG.name}`} />

      {/* Preconnect to API */}
      <link rel="preconnect" href="https://api.oddsightseer.com" />
      <link rel="dns-prefetch" href="https://api.oddsightseer.com" />

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Children for additional custom tags */}
      {children}
    </Helmet>
  );
};

export default SEOHelmet;
