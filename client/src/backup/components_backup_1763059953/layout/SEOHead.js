import { Helmet } from '@dr.pogodin/react-helmet';

export default function SEOHead({ 
  title = "OddSightSeer - Smart Sports Betting Analytics",
  description = "Find the best sports betting odds, analyze player props, and track your betting performance with advanced analytics.",
  keywords = "sports betting, odds comparison, player props, betting analytics, NFL, NBA, MLB",
  image = "/og-image.png",
  url = window.location.href
}) {
  const fullTitle = title.includes('OddSightSeer') ? title : `${title} | OddSightSeer`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="OddSightSeer" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="OddSightSeer" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="msapplication-TileColor" content="#8B5CF6" />
      <link rel="canonical" href={url} />
      
      {/* Performance hints */}
      <link rel="preconnect" href="https://api.the-odds-api.com" />
      <link rel="dns-prefetch" href="https://api.the-odds-api.com" />
    </Helmet>
  );
}
