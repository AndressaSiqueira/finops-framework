import { Request, Response, NextFunction } from 'express';
import { getApiKeyConfig, isValidApiKey } from '../config/apiKeys';

declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
      apiKeyConfig?: import('../types/rateLimit').ApiKeyConfig;
    }
  }
}

/**
 * Middleware to validate API key from request headers
 * Expects API key in 'X-API-Key' header
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Please provide X-API-Key header.',
    });
    return;
  }

  if (!isValidApiKey(apiKey)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or disabled API key.',
    });
    return;
  }

  const config = getApiKeyConfig(apiKey);
  req.apiKey = apiKey;
  req.apiKeyConfig = config;

  next();
}
