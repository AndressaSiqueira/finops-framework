import { Router, Request, Response } from 'express';
import { validateApiKey } from '../middleware/apiKeyValidator';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Health check endpoint (no authentication required)
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Protected endpoint demonstrating rate limiting
 * Simulates a FinOps cost analysis endpoint
 */
router.get('/api/v1/costs', validateApiKey, rateLimiter, (req: Request, res: Response) => {
  res.json({
    message: 'Cost data retrieved successfully',
    apiKey: req.apiKeyConfig?.name,
    data: {
      totalCost: 1234.56,
      period: 'last-30-days',
      currency: 'USD',
      services: [
        { name: 'Compute', cost: 800.00 },
        { name: 'Storage', cost: 234.56 },
        { name: 'Network', cost: 200.00 },
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Another protected endpoint
 * Simulates a budget recommendations endpoint
 */
router.get('/api/v1/recommendations', validateApiKey, rateLimiter, (req: Request, res: Response) => {
  res.json({
    message: 'Recommendations retrieved successfully',
    apiKey: req.apiKeyConfig?.name,
    data: {
      recommendations: [
        {
          id: 1,
          title: 'Resize underutilized VMs',
          potentialSavings: 300.00,
          priority: 'high',
        },
        {
          id: 2,
          title: 'Enable auto-scaling',
          potentialSavings: 150.00,
          priority: 'medium',
        },
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Rate limit status endpoint
 * Shows current rate limit status for the API key
 */
router.get('/api/v1/rate-limit-status', validateApiKey, async (req: Request, res: Response) => {
  const apiKey = req.apiKey;
  const config = req.apiKeyConfig;

  if (!apiKey || !config) {
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  try {
    const { rateLimitService } = await import('../services/rateLimitService');
    const status = await rateLimitService.getRateLimitStatus(apiKey, config.rateLimit);

    res.json({
      apiKey: config.name,
      rateLimit: {
        windowMs: config.rateLimit.windowMs,
        maxRequests: config.rateLimit.maxRequests,
      },
      current: {
        remaining: status.remaining,
        reset: status.reset,
      },
    });
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
