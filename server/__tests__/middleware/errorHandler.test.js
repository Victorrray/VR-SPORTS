/**
 * Error Handler Middleware Tests
 */

const { errorHandler, asyncHandler, notFoundHandler } = require('../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      id: 'test-request-123',
      path: '/api/odds',
      method: 'GET',
      ip: '127.0.0.1',
      __userId: 'user-123',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle errors with status code', () => {
      const error = new Error('Test error');
      error.status = 400;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should default to 500 status code for errors without status', () => {
      const error = new Error('Unknown error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should include error message in response', () => {
      const error = new Error('Validation failed');
      error.status = 422;

      errorHandler(error, mockReq, mockRes, mockNext);

      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.error.message).toBe('Validation failed');
    });

    it('should include request ID in response', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.error.requestId).toBeDefined();
    });
  });

  describe('asyncHandler', () => {
    it('should wrap async functions and catch errors', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrapped = asyncHandler(asyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass successful async results through', async () => {
      const asyncFn = jest.fn().mockResolvedValue({ data: 'success' });
      const wrapped = asyncHandler(asyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for unmatched routes', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should include path and method in 404 response', () => {
      notFoundHandler(mockReq, mockRes);

      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.error.path).toBe('/api/odds');
      expect(callArgs.error.method).toBe('GET');
    });
  });
});
