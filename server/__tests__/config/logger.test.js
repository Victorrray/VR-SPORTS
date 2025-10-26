/**
 * Logger Configuration Tests
 */

const { logger, logError, logWarn, logInfo, logDebug } = require('../../config/logger');

describe('Logger Configuration', () => {
  beforeEach(() => {
    // Mock logger methods
    jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logError', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error');
      const context = { userId: 'user-123', path: '/api/odds' };

      logError(error, context);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should include error message and stack', () => {
      const error = new Error('Test error');

      logError(error, {});

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logWarn', () => {
    it('should log warnings with context', () => {
      const message = 'API rate limit approaching';
      const context = { remaining: 10 };

      logWarn(message, context);

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('logInfo', () => {
    it('should log info messages', () => {
      const message = 'Server started';
      const context = { port: 3001 };

      logInfo(message, context);

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('logDebug', () => {
    it('should log debug messages', () => {
      const message = 'Processing request';
      const context = { requestId: 'req-123' };

      logDebug(message, context);

      expect(logger.debug).toHaveBeenCalled();
    });
  });
});
