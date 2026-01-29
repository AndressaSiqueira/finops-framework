# Session Configuration Guide

## Overview

The FinOps Demo Application uses express-session middleware to manage user sessions. Sessions can be configured through environment variables to control timeout duration and security settings.

## Configuration

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SESSION_TIMEOUT_MINUTES` | Session timeout in minutes | 60 | 30, 60, 120 |
| `SESSION_SECRET` | Secret key for session encryption | (required) | `your-secret-key` |
| `NODE_ENV` | Environment mode | development | production, development |
| `PORT` | Server port | 3000 | 8080 |

### Setting Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your values:
   ```env
   SESSION_TIMEOUT_MINUTES=60
   SESSION_SECRET=your-secret-key-change-in-production
   PORT=3000
   NODE_ENV=development
   ```

### Session Timeout

The `SESSION_TIMEOUT_MINUTES` environment variable controls how long a user session remains active without activity.

- **Value**: Number of minutes (e.g., 30, 60, 120)
- **Default**: 60 minutes
- **Conversion**: The value is automatically converted to milliseconds for express-session

#### Examples:

```bash
# 30 minute timeout
SESSION_TIMEOUT_MINUTES=30

# 60 minute timeout (default)
SESSION_TIMEOUT_MINUTES=60

# 2 hour timeout
SESSION_TIMEOUT_MINUTES=120
```

## How Sessions Work

1. **Login**: When a user logs in via `/login`, a session is created with the configured timeout
2. **Active Session**: The session remains active for the duration specified in `SESSION_TIMEOUT_MINUTES`
3. **Expiration**: After the timeout period of inactivity, the session expires
4. **Re-authentication**: Users must log in again after session expiration

## Security Settings

### Cookie Security

The application automatically configures secure cookie settings:

- **httpOnly**: `true` - Prevents client-side JavaScript from accessing cookies
- **sameSite**: `lax` - Provides CSRF protection
- **secure**: `true` in production - Ensures cookies are only sent over HTTPS

### Production Deployment

For production deployments on Azure Container Apps:

1. Set environment variables in Azure Container Apps:
   ```bash
   az containerapp update \
     --name finops-demo \
     --resource-group finops-rg \
     --set-env-vars \
       SESSION_TIMEOUT_MINUTES=60 \
       SESSION_SECRET=your-production-secret \
       NODE_ENV=production
   ```

2. Ensure HTTPS is enabled (secure cookies require HTTPS in production)

## API Endpoints

### Session Management Endpoints

#### `POST /login`
Create a new session
```bash
curl -X POST http://localhost:3000/login
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "sessionTimeout": 3600000,
  "user": {
    "id": 1,
    "username": "demo-user",
    "loginTime": "2024-01-29T15:30:00.000Z"
  }
}
```

#### `GET /dashboard`
Access protected resource (requires active session)
```bash
curl http://localhost:3000/dashboard \
  --cookie "connect.sid=..."
```

Response (authenticated):
```json
{
  "success": true,
  "message": "Welcome to FinOps Dashboard",
  "user": {...},
  "sessionAge": 120000,
  "sessionMaxAge": 3600000
}
```

Response (session expired):
```json
{
  "success": false,
  "message": "Session expired. Please login again."
}
```

#### `GET /session-info`
Get current session information
```bash
curl http://localhost:3000/session-info
```

Response:
```json
{
  "hasSession": true,
  "sessionTimeout": 3600000,
  "sessionTimeoutMinutes": 60,
  "user": {...}
}
```

#### `POST /logout`
Destroy current session
```bash
curl -X POST http://localhost:3000/logout
```

## Troubleshooting

### Sessions Expiring Too Quickly

If sessions are expiring faster than expected:

1. **Check Environment Variable**: Verify `SESSION_TIMEOUT_MINUTES` is set correctly
   ```bash
   echo $SESSION_TIMEOUT_MINUTES
   ```

2. **Verify Configuration**: Check the session-info endpoint
   ```bash
   curl http://localhost:3000/session-info
   ```

3. **Check Logs**: Look for session timeout value in server logs
   ```
   FinOps Demo Application running on port 3000
   Session timeout: 60 minutes
   ```

4. **Common Issues**:
   - Environment variable not set → falls back to 60 minute default
   - Variable set but not as number → may cause unexpected behavior
   - Azure Container App env var not configured → container uses default

### Testing Session Timeout

To test session timeout behavior:

1. Login and note the session timeout value
2. Wait for the configured duration
3. Attempt to access a protected route
4. Session should be expired

## Running Tests

The application includes comprehensive tests for session behavior:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Server will start on http://localhost:3000
```

### Testing Session Configuration

The session configuration can be tested by setting different values:

```bash
# Test with 30 minute timeout
SESSION_TIMEOUT_MINUTES=30 npm start

# Test with 5 minute timeout
SESSION_TIMEOUT_MINUTES=5 npm start
```
