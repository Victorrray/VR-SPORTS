const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 * GET /health
 * 
 * Returns:
 * {
 *   status: 'ok' | 'degraded',
 *   timestamp: ISO string,
 *   uptime: seconds,
 *   environment: 'production' | 'development',
 *   version: '1.0.0',
 *   checks: {
 *     database: 'ok' | 'error',
 *     cache: 'ok' | 'error',
 *     externalApi: 'ok' | 'error'
 *   }
 * }
 */
router.get('/health', async (req, res) => {
  const checks = {
    database: 'ok',
    cache: 'ok',
    externalApi: 'ok',
  };

  let status = 'ok';

  // Check database connection (Supabase)
  try {
    // If you have a Supabase client, test it here
    // const { data } = await supabase.from('users').select('count', { count: 'exact' });
    checks.database = 'ok';
  } catch (err) {
    checks.database = 'error';
    status = 'degraded';
  }

  // Check cache (in-memory or Redis)
  try {
    // Test cache operations if applicable
    checks.cache = 'ok';
  } catch (err) {
    checks.cache = 'error';
    status = 'degraded';
  }

  // Check external API connectivity (TheOddsAPI)
  try {
    // Optional: Make a lightweight test call to TheOddsAPI
    // This can be expensive, so only do it if needed
    checks.externalApi = 'ok';
  } catch (err) {
    checks.externalApi = 'error';
    status = 'degraded';
  }

  const healthResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    checks,
  };

  // Return 200 for ok, 503 for degraded
  const statusCode = status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthResponse);
});

/**
 * Liveness probe (for Kubernetes/Docker)
 * GET /health/live
 * 
 * Returns 200 if the service is running
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness probe (for Kubernetes/Docker)
 * GET /health/ready
 * 
 * Returns 200 if the service is ready to handle requests
 */
router.get('/health/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    // For now, just return 200
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', error: err.message });
  }
});

module.exports = router;
