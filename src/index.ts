import express, { Express, Request, Response, NextFunction } from 'express';
import { config } from './config';
import { redisService } from './services/redis';
import routes from './routes';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

async function startServer() {
  try {
    // Connect to Redis
    console.log('Connecting to Redis...');
    await redisService.connect();
    console.log('Redis connected successfully');

    // Start server
    app.listen(config.port, () => {
      console.log(`FinOps Framework API running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`
Available API Keys for testing:
- demo-key-basic (10 req/min)
- demo-key-premium (100 req/min)
- demo-key-enterprise (1000 req/min)
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;
