const Sentry = require("@sentry/node");

/**
 * Initialize Sentry for error tracking
 * @param {Express.Application} app - Express app instance
 */
function initSentry(app) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️ SENTRY_DSN not set - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({
        app: true,
        request: true,
        serverName: true,
        transaction: true,
      }),
    ],
    // Ignore certain errors that are not critical
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors that are expected
      'NetworkError',
      'Network request failed',
    ],
  });

  // RequestHandler creates a new context for every request
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingMiddleware());

  console.log('✅ Sentry initialized for error tracking');
}

/**
 * Sentry error handler middleware
 * Should be added after all other middleware and routes
 */
function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * Capture an exception manually
 */
function captureException(error, context = {}) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture a message
 */
function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

module.exports = {
  initSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  Sentry,
};
