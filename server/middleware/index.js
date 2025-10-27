/**
 * Middleware Index
 * Exports all middleware functions
 */

const { 
  requireUser, 
  checkPlanAccess, 
  enforceUsage, 
  authenticate,
  getUserProfile,
  getCachedPlan,
  setCachedPlan,
  isLocalRequest
} = require('./auth');

const { errorHandler, asyncHandler, notFoundHandler } = require('./errorHandler');
const { createCorsMiddleware } = require('./cors');

module.exports = {
  // Auth middleware
  requireUser,
  checkPlanAccess,
  enforceUsage,
  authenticate,
  getUserProfile,
  getCachedPlan,
  setCachedPlan,
  isLocalRequest,
  
  // Error handling middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,
  
  // CORS middleware
  createCorsMiddleware
};
