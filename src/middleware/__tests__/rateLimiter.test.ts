import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../rateLimiter';
import { rateLimitService } from '../../services/rateLimitService';

jest.mock('../../services/rateLimitService');

describe('rateLimiter middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let setMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    setMock = jest.fn().mockReturnThis();

    mockRequest = {
      apiKey: 'test-key',
      apiKeyConfig: {
        key: 'test-key',
        name: 'Test Plan',
        rateLimit: {
          windowMs: 60000,
          maxRequests: 10,
        },
        enabled: true,
      },
    };
    mockResponse = {
      status: statusMock,
      set: setMock,
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow request when under rate limit', async () => {
    const rateLimitResult = {
      allowed: true,
      info: {
        limit: 10,
        remaining: 5,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    };

    (rateLimitService.checkRateLimit as jest.Mock).mockResolvedValue(rateLimitResult);

    rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(setMock).toHaveBeenCalledWith({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '5',
      'X-RateLimit-Reset': expect.any(String),
    });
    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should deny request when rate limit exceeded', async () => {
    const rateLimitResult = {
      allowed: false,
      info: {
        limit: 10,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    };

    (rateLimitService.checkRateLimit as jest.Mock).mockResolvedValue(rateLimitResult);

    rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      limit: 10,
      remaining: 0,
      reset: expect.any(Number),
      retryAfter: expect.any(Number),
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should include rate limit headers in response', async () => {
    const rateLimitResult = {
      allowed: true,
      info: {
        limit: 10,
        remaining: 5,
        reset: 1234567890,
      },
    };

    (rateLimitService.checkRateLimit as jest.Mock).mockResolvedValue(rateLimitResult);

    rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(setMock).toHaveBeenCalledWith({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '5',
      'X-RateLimit-Reset': '1234567890',
    });
  });

  it('should return 500 if called without API key', () => {
    mockRequest.apiKey = undefined;
    mockRequest.apiKeyConfig = undefined;

    rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Rate limiter called without API key validation.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    (rateLimitService.checkRateLimit as jest.Mock).mockRejectedValue(new Error('Redis error'));

    rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should fail open (allow request)
    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
