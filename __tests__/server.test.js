/**
 * Integration tests for server session behavior
 */

const request = require('supertest');
const app = require('../src/server');

describe('Server Session Endpoints', () => {
  let agent;

  beforeEach(() => {
    // Create a new agent for each test to maintain session cookies
    agent = request.agent(app);
  });

  describe('POST /login', () => {
    test('should create a session on login', async () => {
      const response = await agent
        .post('/login')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.sessionTimeout).toBeDefined();
    });

    test('should set session timeout to configured value', async () => {
      const response = await agent
        .post('/login')
        .expect(200);

      // Default is 60 minutes = 3600000 milliseconds
      const expectedTimeout = 60 * 60 * 1000;
      expect(response.body.sessionTimeout).toBe(expectedTimeout);
    });
  });

  describe('GET /dashboard', () => {
    test('should return 401 without session', async () => {
      const response = await agent
        .get('/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session expired');
    });

    test('should allow access with valid session', async () => {
      // First login
      await agent.post('/login').expect(200);

      // Then access protected route
      const response = await agent
        .get('/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    test('should include session info in response', async () => {
      await agent.post('/login').expect(200);

      const response = await agent
        .get('/dashboard')
        .expect(200);

      expect(response.body.sessionMaxAge).toBeDefined();
      expect(response.body.sessionAge).toBeDefined();
    });
  });

  describe('GET /session-info', () => {
    test('should return session timeout information', async () => {
      const response = await agent
        .get('/session-info')
        .expect(200);

      expect(response.body.sessionTimeout).toBeDefined();
      expect(response.body.sessionTimeoutMinutes).toBeDefined();
    });

    test('should show correct timeout in minutes', async () => {
      const response = await agent
        .get('/session-info')
        .expect(200);

      // Should be 60 minutes by default (allow for floating point precision)
      expect(response.body.sessionTimeoutMinutes).toBeCloseTo(60, 1);
    });

    test('should indicate no session before login', async () => {
      const response = await agent
        .get('/session-info')
        .expect(200);

      expect(response.body.hasSession).toBe(false);
      expect(response.body.user).toBeNull();
    });

    test('should indicate active session after login', async () => {
      await agent.post('/login').expect(200);

      const response = await agent
        .get('/session-info')
        .expect(200);

      expect(response.body.hasSession).toBe(true);
      expect(response.body.user).toBeDefined();
    });
  });

  describe('POST /logout', () => {
    test('should destroy session on logout', async () => {
      // Login first
      await agent.post('/login').expect(200);

      // Verify session exists
      let response = await agent.get('/dashboard').expect(200);
      expect(response.body.success).toBe(true);

      // Logout
      await agent.post('/logout').expect(200);

      // Verify session is destroyed
      response = await agent.get('/dashboard').expect(401);
      expect(response.body.success).toBe(false);
    });
  });
});
