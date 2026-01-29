import { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../apiKeyValidator';
import { getApiKeyConfig, isValidApiKey } from '../../config/apiKeys';

jest.mock('../../config/apiKeys');

describe('validateApiKey middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      header: jest.fn(),
    };
    mockResponse = {
      status: statusMock,
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject request without API key', () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    validateApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'API key is required. Please provide X-API-Key header.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request with invalid API key', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('invalid-key');
    (isValidApiKey as jest.Mock).mockReturnValue(false);

    validateApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid or disabled API key.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should accept request with valid API key', () => {
    const apiKey = 'valid-key';
    const config = {
      key: apiKey,
      name: 'Test Plan',
      rateLimit: { windowMs: 60000, maxRequests: 10 },
      enabled: true,
    };

    (mockRequest.header as jest.Mock).mockReturnValue(apiKey);
    (isValidApiKey as jest.Mock).mockReturnValue(true);
    (getApiKeyConfig as jest.Mock).mockReturnValue(config);

    validateApiKey(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.apiKey).toBe(apiKey);
    expect(mockRequest.apiKeyConfig).toBe(config);
    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
