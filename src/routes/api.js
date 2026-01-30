const express = require('express');
const router = express.Router();

/**
 * Rota de exemplo para demonstrar rate limiting
 */
router.get('/costs', (req, res) => {
  res.json({
    message: 'Cost data retrieved successfully',
    data: {
      currentMonth: 1234.56,
      lastMonth: 1150.30,
      trend: '+7.3%'
    }
  });
});

/**
 * Rota de health check (sem rate limiting)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Rota de informações de rate limit
 */
router.get('/rate-limit-info', (req, res) => {
  const headers = {
    limit: res.getHeader('X-RateLimit-Limit'),
    remaining: res.getHeader('X-RateLimit-Remaining'),
    reset: res.getHeader('X-RateLimit-Reset')
  };

  res.json({
    message: 'Rate limit information',
    rateLimit: headers,
    resetTime: new Date(headers.reset * 1000).toISOString()
  });
});

module.exports = router;
