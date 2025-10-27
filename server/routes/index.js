/**
 * Routes Index
 * Central export point for all route modules
 */

const healthRoutes = require('./health');
const usersRoutes = require('./users');
const adminRoutes = require('./admin');

/**
 * Register all routes with the Express app
 */
function registerRoutes(app) {
  // Health check routes
  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);
  
  // User routes
  app.use('/api', usersRoutes);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);
  
  // TODO: Add more routes as they are extracted
  // app.use('/api/odds', oddsRoutes);
  // app.use('/api/billing', billingRoutes);
  // app.use('/api/sports', sportsRoutes);
}

module.exports = {
  registerRoutes,
  healthRoutes,
  usersRoutes,
  adminRoutes,
};
