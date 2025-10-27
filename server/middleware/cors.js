/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing configuration
 */

/**
 * Create CORS middleware with proper origin validation
 */
function createCorsMiddleware() {
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:10000',
    'https://odds-frontend-j2pn.onrender.com',
    'https://my-react-frontend-021i.onrender.com',
    // Primary production domains (correct spelling)
    'https://oddsightseer.com',
    'https://www.oddsightseer.com'
  ]);

  // Add FRONTEND_URL if it exists and isn't already in the set
  if (process.env.FRONTEND_URL) {
    allowedOrigins.add(process.env.FRONTEND_URL);
  }

  console.log('🔄 CORS Allowed Origins:', Array.from(allowedOrigins));

  return (req, res, next) => {
    const origin = req.headers.origin;
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, stripe-signature, x-user-id, Cache-Control, Pragma, Expires');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      return next();
    }
    
    // In production, only allow whitelisted origins
    if (!origin || allowedOrigins.has(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, stripe-signature, x-user-id, Cache-Control, Pragma, Expires');
      res.header('Access-Control-Max-Age', '86400');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      return next();
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    return res.status(403).json({ error: 'Not allowed by CORS' });
  };
}

module.exports = {
  createCorsMiddleware
};
