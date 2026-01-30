require('dotenv').config();
const express = require('express');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');
const { closeRedisClient } = require('./utils/redisClient');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsing de JSON
app.use(express.json());

// Middleware de logging básico
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check sem rate limiting
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Aplica rate limiting middleware para todas as rotas da API
app.use('/api', rateLimitMiddleware, apiRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'FinOps Framework API',
    version: '1.0.0',
    description: 'API para análise de custos e práticas FinOps',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully');
  await closeRedisClient();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server gracefully');
  await closeRedisClient();
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`FinOps Framework API listening on port ${PORT}`);
});

module.exports = { app, server };
