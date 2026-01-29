import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  rateLimit: {
    defaultWindowMs: parseInt(process.env.DEFAULT_RATE_LIMIT_WINDOW || '60000', 10),
    defaultMaxRequests: parseInt(process.env.DEFAULT_RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
