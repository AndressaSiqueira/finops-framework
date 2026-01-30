const request = require('supertest');
const { app, server } = require('../src/server');
const { getRedisClient, closeRedisClient } = require('../src/utils/redisClient');

describe('Rate Limiting Middleware', () => {
  let redis;

  beforeAll(async () => {
    // Aguarda um pouco para o servidor inicializar
    await new Promise(resolve => setTimeout(resolve, 1000));
    redis = await getRedisClient();
  });

  afterAll(async () => {
    await closeRedisClient();
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  beforeEach(async () => {
    // Limpa dados de teste no Redis antes de cada teste
    const keys = await redis.keys('ratelimit:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  });

  describe('API Key Validation', () => {
    test('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/costs')
        .expect(401);

      expect(response.body.error).toBe('API key is required');
    });

    test('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body.error).toBe('Invalid API key');
    });

    test('should accept valid API key', async () => {
      const response = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'free-api-key-123')
        .expect(200);

      expect(response.body.message).toBe('Cost data retrieved successfully');
    });
  });

  describe('Rate Limit Headers', () => {
    test('should include rate limit headers in response', async () => {
      const response = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'free-api-key-123')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    test('should decrement remaining count with each request', async () => {
      const response1 = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'free-api-key-123')
        .expect(200);

      const response2 = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'free-api-key-123')
        .expect(200);

      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      expect(remaining2).toBeLessThan(remaining1);
    });
  });

  describe('Rate Limit Enforcement - Free Tier', () => {
    test('should allow requests within limit', async () => {
      // Fazer 5 requisições (bem abaixo do limite de 100)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/costs')
          .set('X-API-Key', 'free-api-key-123')
          .expect(200);
      }
    });

    test('should return 429 when limit is exceeded', async () => {
      // Simula exceder o limite fazendo muitas requisições
      // Para teste, vamos mockar ou fazer requisições suficientes
      const limit = 100;
      
      // Faz limit + 1 requisições
      for (let i = 0; i < limit; i++) {
        await request(app)
          .get('/api/costs')
          .set('X-API-Key', 'free-api-key-123');
      }

      // A próxima deve retornar 429
      const response = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'free-api-key-123')
        .expect(429);

      expect(response.body.error).toBe('Too Many Requests');
      expect(response.body.retryAfter).toBeDefined();
    });
  });

  describe('Different Tier Limits', () => {
    test('pro tier should have higher limit than free tier', async () => {
      const freeResponse = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'free-api-key-123')
        .expect(200);

      const proResponse = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'pro-api-key-456')
        .expect(200);

      const freeLimit = parseInt(freeResponse.headers['x-ratelimit-limit']);
      const proLimit = parseInt(proResponse.headers['x-ratelimit-limit']);

      expect(proLimit).toBeGreaterThan(freeLimit);
    });

    test('enterprise tier should have highest limit', async () => {
      const enterpriseResponse = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'enterprise-api-key-789')
        .expect(200);

      const proResponse = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'pro-api-key-456')
        .expect(200);

      const enterpriseLimit = parseInt(enterpriseResponse.headers['x-ratelimit-limit']);
      const proLimit = parseInt(proResponse.headers['x-ratelimit-limit']);

      expect(enterpriseLimit).toBeGreaterThan(proLimit);
    });
  });

  describe('Rate Limit Info Endpoint', () => {
    test('should return rate limit information', async () => {
      const response = await request(app)
        .get('/api/rate-limit-info')
        .set('X-API-Key', 'free-api-key-123')
        .expect(200);

      expect(response.body.message).toBe('Rate limit information');
      expect(response.body.rateLimit).toBeDefined();
      expect(response.body.rateLimit.limit).toBeDefined();
      expect(response.body.rateLimit.remaining).toBeDefined();
      expect(response.body.resetTime).toBeDefined();
    });
  });

  describe('Health Check Endpoint', () => {
    test('should not require API key for health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Edge Cases', () => {
    test('should handle concurrent requests correctly', async () => {
      // Fazer múltiplas requisições concorrentes
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/costs')
            .set('X-API-Key', 'free-api-key-123')
        );
      }

      const responses = await Promise.all(promises);
      
      // Todas devem ter sido bem-sucedidas
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should isolate rate limits between different API keys', async () => {
      // Fazer requisições com diferentes API keys
      await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'free-api-key-123')
        .expect(200);

      const response = await request(app)
        .get('/api/costs')
        .set('X-API-Key', 'pro-api-key-456')
        .expect(200);

      // A contagem do pro deve estar em 99 (limite de 1000)
      const remaining = parseInt(response.headers['x-ratelimit-remaining']);
      expect(remaining).toBeGreaterThan(990); // Deve estar próximo do máximo
    });
  });
});
