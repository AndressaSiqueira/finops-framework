const { getRedisClient } = require('../utils/redisClient');
const rateLimitConfig = require('../config/rateLimitConfig');
const logger = require('../utils/logger');

/**
 * Mock API Key to Tier mapping
 * Em produção, isso viria de um banco de dados ou serviço de autenticação
 */
const apiKeyToTier = {
  'free-api-key-123': 'free',
  'pro-api-key-456': 'pro',
  'enterprise-api-key-789': 'enterprise'
};

/**
 * Middleware de Rate Limiting por API Key
 * 
 * Implementa rate limiting com janela deslizante usando Redis
 * Retorna headers HTTP padrão e erro 429 quando limite é excedido
 */
async function rateLimitMiddleware(req, res, next) {
  try {
    // Extrai API key do header
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key is required',
        message: 'Please provide an API key in the X-API-Key header'
      });
    }

    // Determina o tier do cliente
    const tier = apiKeyToTier[apiKey];
    if (!tier) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    // Obtém configuração de rate limit para o tier
    const tierConfig = rateLimitConfig.tiers[tier];
    const { max, windowSeconds } = tierConfig;

    // Conecta ao Redis
    const redis = await getRedisClient();
    
    // Chave para armazenar o contador no Redis
    const redisKey = `ratelimit:${apiKey}`;
    
    // Obtém timestamp atual em segundos
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Usa transação Redis para operações atômicas
    const multi = redis.multi();
    
    // Remove entradas antigas (fora da janela)
    multi.zRemRangeByScore(redisKey, 0, windowStart);
    
    // Adiciona novo registro com timestamp atual
    // Usa timestamp + random para garantir unicidade mesmo em alta concorrência
    multi.zAdd(redisKey, { score: now, value: `${now}-${Math.random()}` });
    
    // Conta número de requisições na janela
    multi.zCard(redisKey);
    
    // Define expiração da chave
    multi.expire(redisKey, windowSeconds);
    
    const results = await multi.exec();
    const count = results[2]; // Resultado do zCard

    // Calcula valores para os headers
    const remaining = Math.max(0, max - count);
    const resetTime = now + windowSeconds;

    // Adiciona headers de rate limit à resposta
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    // Verifica se o limite foi excedido
    // Nota: count inclui a requisição atual, então se max=100, a 100ª requisição
    // é permitida (count=100) e a 101ª é rejeitada (count=101)
    if (count > max) {
      logger.warn('Rate limit exceeded', {
        apiKey: apiKey.substring(0, 10) + '...',
        tier,
        count,
        max,
        ip: req.ip
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${max} requests per ${windowSeconds} seconds allowed.`,
        retryAfter: windowSeconds
      });
    }

    // Log de requisição bem-sucedida (debug level)
    logger.debug('Rate limit check passed', {
      apiKey: apiKey.substring(0, 10) + '...',
      tier,
      count,
      remaining
    });

    next();
  } catch (error) {
    logger.error('Rate limit middleware error', {
      error: error.message,
      stack: error.stack
    });
    
    // AVISO DE SEGURANÇA: Em caso de erro no Redis, a requisição é permitida
    // para não bloquear a aplicação. Isso pode ser explorado durante indisponibilidade do Redis.
    // Em produção, considere implementar rate limiting em memória como fallback
    // ou retornar 503 Service Unavailable se rate limiting é crítico para segurança.
    logger.warn('Rate limiting bypassed due to Redis error - potential security risk', {
      apiKey: req.headers['x-api-key']?.substring(0, 10) + '...',
      ip: req.ip
    });
    
    next();
  }
}

module.exports = rateLimitMiddleware;
