const redis = require('redis');
const rateLimitConfig = require('../config/rateLimitConfig');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * Inicializa e retorna o cliente Redis
 */
async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = redis.createClient({
    socket: {
      host: rateLimitConfig.redis.host,
      port: rateLimitConfig.redis.port
    },
    password: rateLimitConfig.redis.password
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', { error: err.message });
  });

  redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Fecha a conexão com Redis
 */
async function closeRedisClient() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  getRedisClient,
  closeRedisClient
};
