import { redisService } from './redis';
import { RateLimitConfig, RateLimitResult, RateLimitInfo } from '../types/rateLimit';

/**
 * RateLimitService implements a sliding window rate limiting algorithm using Redis
 * It tracks request counts per API key within a time window
 */
export class RateLimitService {
  private readonly keyPrefix = 'ratelimit:';

  /**
   * Check if a request should be allowed based on rate limits
   * Uses a sliding window counter stored in Redis
   */
  async checkRateLimit(apiKey: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = this.getRateLimitKey(apiKey);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      const redis = redisService.getClient();

      // Remove old entries outside the current window
      await redis.zRemRangeByScore(key, 0, windowStart);

      // Count requests in the current window
      const requestCount = await redis.zCard(key);

      // Check if limit is exceeded
      if (requestCount >= config.maxRequests) {
        // Get the oldest request timestamp to calculate reset time
        const oldestRequests = await redis.zRange(key, 0, 0);
        const resetTime = oldestRequests.length > 0 
          ? parseInt(oldestRequests[0]) + config.windowMs 
          : now + config.windowMs;

        return {
          allowed: false,
          info: {
            limit: config.maxRequests,
            remaining: 0,
            reset: Math.ceil(resetTime / 1000),
          },
        };
      }

      // Add current request to the sorted set
      await redis.zAdd(key, { score: now, value: `${now}` });

      // Set expiration on the key to clean up automatically
      await redis.expire(key, Math.ceil(config.windowMs / 1000) + 1);

      // Calculate reset time (end of current window)
      const resetTime = now + config.windowMs;

      return {
        allowed: true,
        info: {
          limit: config.maxRequests,
          remaining: config.maxRequests - (requestCount + 1),
          reset: Math.ceil(resetTime / 1000),
        },
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request but log the issue
      return {
        allowed: true,
        info: {
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          reset: Math.ceil((now + config.windowMs) / 1000),
        },
      };
    }
  }

  /**
   * Get current rate limit status without consuming a request
   */
  async getRateLimitStatus(apiKey: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const key = this.getRateLimitKey(apiKey);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      const redis = redisService.getClient();

      // Remove old entries
      await redis.zRemRangeByScore(key, 0, windowStart);

      // Count current requests
      const requestCount = await redis.zCard(key);

      // Calculate reset time
      const oldestRequests = await redis.zRange(key, 0, 0);
      const resetTime = oldestRequests.length > 0 
        ? parseInt(oldestRequests[0]) + config.windowMs 
        : now + config.windowMs;

      return {
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - requestCount),
        reset: Math.ceil(resetTime / 1000),
      };
    } catch (error) {
      console.error('Rate limit status error:', error);
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Math.ceil((now + config.windowMs) / 1000),
      };
    }
  }

  /**
   * Reset rate limit for an API key (useful for testing or admin operations)
   */
  async resetRateLimit(apiKey: string): Promise<void> {
    const key = this.getRateLimitKey(apiKey);
    try {
      const redis = redisService.getClient();
      await redis.del(key);
    } catch (error) {
      console.error('Rate limit reset error:', error);
    }
  }

  private getRateLimitKey(apiKey: string): string {
    return `${this.keyPrefix}${apiKey}`;
  }
}

export const rateLimitService = new RateLimitService();
