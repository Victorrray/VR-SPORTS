/**
 * Routes Index
 * Central export point for all route modules
 */

const healthRoutes = require('./health');
const usersRoutes = require('./users');
const adminRoutes = require('./admin');
const sportsRoutes = require('./sports');
const billingRoutes = require('./billing');
const oddsRoutes = require('./odds');
const featuredRoutes = require('./featured');
const gradesRoutes = require('./grades');

/**
 * Register all routes with the Express app
 * 
 * NOTE: Billing routes are registered separately in index.js BEFORE express.json()
 * to allow raw body access for Stripe webhook signature verification
 */
function registerRoutes(app) {
  // Health check routes
  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);
  
  // User routes
  app.use('/api', usersRoutes);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);
  
  // Sports routes
  app.use('/api', sportsRoutes);
  
  // Billing routes - REGISTERED SEPARATELY in index.js before express.json()
  // app.use('/api/billing', billingRoutes);
  
  // Odds routes
  app.use('/api/odds', oddsRoutes);
  
  // Featured routes
  app.use('/api/featured', featuredRoutes);
  
  // Grades routes (bet grading)
  app.use('/api', gradesRoutes);
}

module.exports = {
  registerRoutes,
  healthRoutes,
  usersRoutes,
  adminRoutes,
  sportsRoutes,
  billingRoutes,
  oddsRoutes,
  gradesRoutes,
};
