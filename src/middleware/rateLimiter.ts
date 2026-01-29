import { Request, Response, NextFunction } from 'express';
import { rateLimitService } from '../services/rateLimitService';

/**
 * Middleware to enforce rate limiting based on API key
 * Should be used after validateApiKey middleware
 */
export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.apiKey;
  const config = req.apiKeyConfig;

  if (!apiKey || !config) {
    // If no API key, this middleware should not have been called
    // This is a programming error, so we fail closed
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Rate limiter called without API key validation.',
    });
    return;
  }

  try {
    const result = await rateLimitService.checkRateLimit(apiKey, config.rateLimit);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': result.info.limit.toString(),
      'X-RateLimit-Remaining': result.info.remaining.toString(),
      'X-RateLimit-Reset': result.info.reset.toString(),
    });

    if (!result.allowed) {
      // Calculate retry after in seconds
      const retryAfter = result.info.reset - Math.floor(Date.now() / 1000);
      res.set('Retry-After', Math.max(0, retryAfter).toString());

      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: result.info.limit,
        remaining: result.info.remaining,
        reset: result.info.reset,
        retryAfter: Math.max(0, retryAfter),
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // On error, fail open (allow the request) but log the issue
    next();
  }
}
