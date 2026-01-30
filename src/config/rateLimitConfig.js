/**
 * Rate Limiting Configuration
 * 
 * Define os limites de taxa por tier de cliente
 */

const rateLimitConfig = {
  tiers: {
    free: {
      max: parseInt(process.env.RATE_LIMIT_FREE_MAX) || 100,
      windowSeconds: parseInt(process.env.RATE_LIMIT_FREE_WINDOW) || 3600
    },
    pro: {
      max: parseInt(process.env.RATE_LIMIT_PRO_MAX) || 1000,
      windowSeconds: parseInt(process.env.RATE_LIMIT_PRO_WINDOW) || 3600
    },
    enterprise: {
      max: parseInt(process.env.RATE_LIMIT_ENTERPRISE_MAX) || 10000,
      windowSeconds: parseInt(process.env.RATE_LIMIT_ENTERPRISE_WINDOW) || 3600
    }
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  }
};

module.exports = rateLimitConfig;
