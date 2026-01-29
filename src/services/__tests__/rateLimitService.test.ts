import { RateLimitService } from '../rateLimitService';
import { redisService } from '../redis';
import { RateLimitConfig } from '../../types/rateLimit';

// Mock Redis service
jest.mock('../redis');

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;
  let mockRedisClient: any;

  beforeEach(() => {
    rateLimitService = new RateLimitService();
    mockRedisClient = {
      zRemRangeByScore: jest.fn().mockResolvedValue(0),
      zCard: jest.fn().mockResolvedValue(0),
      zRange: jest.fn().mockResolvedValue([]),
      zAdd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
    };
    (redisService.getClient as jest.Mock).mockReturnValue(mockRedisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    const testConfig: RateLimitConfig = {
      windowMs: 60000, // 1 minute
      maxRequests: 10,
    };

    it('should allow request when under limit', async () => {
      mockRedisClient.zCard.mockResolvedValue(5);

      const result = await rateLimitService.checkRateLimit('test-key', testConfig);

      expect(result.allowed).toBe(true);
      expect(result.info.limit).toBe(10);
      expect(result.info.remaining).toBe(4);
      expect(mockRedisClient.zAdd).toHaveBeenCalled();
    });

    it('should deny request when at limit', async () => {
      mockRedisClient.zCard.mockResolvedValue(10);
      mockRedisClient.zRange.mockResolvedValue(['1000000']);

      const result = await rateLimitService.checkRateLimit('test-key', testConfig);

      expect(result.allowed).toBe(false);
      expect(result.info.limit).toBe(10);
      expect(result.info.remaining).toBe(0);
      expect(mockRedisClient.zAdd).not.toHaveBeenCalled();
    });

    it('should remove old entries from window', async () => {
      await rateLimitService.checkRateLimit('test-key', testConfig);

      expect(mockRedisClient.zRemRangeByScore).toHaveBeenCalledWith(
        'ratelimit:test-key',
        0,
        expect.any(Number)
      );
    });

    it('should set expiration on rate limit key', async () => {
      await rateLimitService.checkRateLimit('test-key', testConfig);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        'ratelimit:test-key',
        expect.any(Number)
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.zCard.mockRejectedValue(new Error('Redis error'));

      const result = await rateLimitService.checkRateLimit('test-key', testConfig);

      // Should allow request on error (fail open)
      expect(result.allowed).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    const testConfig: RateLimitConfig = {
      windowMs: 60000,
      maxRequests: 10,
    };

    it('should return correct status', async () => {
      mockRedisClient.zCard.mockResolvedValue(5);
      mockRedisClient.zRange.mockResolvedValue(['1000000']);

      const status = await rateLimitService.getRateLimitStatus('test-key', testConfig);

      expect(status.limit).toBe(10);
      expect(status.remaining).toBe(5);
      expect(status.reset).toBeGreaterThan(0);
    });

    it('should not consume a request', async () => {
      await rateLimitService.getRateLimitStatus('test-key', testConfig);

      expect(mockRedisClient.zAdd).not.toHaveBeenCalled();
    });
  });

  describe('resetRateLimit', () => {
    it('should delete rate limit key', async () => {
      await rateLimitService.resetRateLimit('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('ratelimit:test-key');
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(rateLimitService.resetRateLimit('test-key')).resolves.not.toThrow();
    });
  });
});
