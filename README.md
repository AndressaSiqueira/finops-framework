# FinOps Framework

FinOps Demo Application - Dashboard de custos com integração Azure AI Hub, Cost Management e análise de FinOps. Implementação do framework FinOps com containerização, CI/CD e observabilidade completa.

## Features

- **Session Management**: Configurable session timeout via environment variables
- **Secure Authentication**: HTTP-only cookies with CSRF protection
- **RESTful API**: Clean API endpoints for authentication and dashboard access
- **Production Ready**: Configured for Azure Container Apps deployment

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SESSION_TIMEOUT_MINUTES=60
SESSION_SECRET=your-secret-key-change-in-production
PORT=3000
NODE_ENV=development
```

### Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch
```

## Session Configuration

Sessions are configured through the `SESSION_TIMEOUT_MINUTES` environment variable:

- **Default**: 60 minutes
- **Configurable**: Set any value in minutes (e.g., 30, 60, 120)
- **Automatic Conversion**: Minutes are automatically converted to milliseconds for express-session

For detailed session configuration documentation, see [SESSION_CONFIG.md](SESSION_CONFIG.md).

## API Endpoints

### Authentication
- `POST /login` - Create a new session
- `POST /logout` - Destroy current session
- `GET /session-info` - Get session information

### Protected Routes
- `GET /dashboard` - Access dashboard (requires active session)

## Bug Fix: Session Timeout

**Issue**: Sessions were expiring after 5 minutes instead of configured 60 minutes.

**Root Cause**: The bug was in the session configuration where timeout values weren't properly converted from minutes to milliseconds. Express-session requires `maxAge` in milliseconds, not minutes.

**Solution**: Implemented proper conversion in `src/session-config.js`:
```javascript
const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60', 10);
const timeoutMilliseconds = timeoutMinutes * 60 * 1000; // Convert to milliseconds
```

## Deployment

### Azure Container Apps

Set environment variables in your Azure Container App:

```bash
az containerapp update \
  --name finops-demo \
  --resource-group finops-rg \
  --set-env-vars \
    SESSION_TIMEOUT_MINUTES=60 \
    SESSION_SECRET=your-production-secret \
    NODE_ENV=production
```

## License

MIT
