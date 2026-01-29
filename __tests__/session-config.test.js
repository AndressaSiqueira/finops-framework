/**
 * Tests for session configuration
 * 
 * These tests verify that the session timeout is correctly configured
 * based on the SESSION_TIMEOUT_MINUTES environment variable.
 */

const { getSessionTimeout, getSessionConfig } = require('../src/session-config');

describe('Session Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getSessionTimeout', () => {
    test('should return 60 minutes in milliseconds by default', () => {
      delete process.env.SESSION_TIMEOUT_MINUTES;
      const timeout = getSessionTimeout();
      const expectedTimeout = 60 * 60 * 1000; // 60 minutes in milliseconds
      expect(timeout).toBe(expectedTimeout);
      expect(timeout).toBe(3600000);
    });

    test('should respect SESSION_TIMEOUT_MINUTES environment variable', () => {
      process.env.SESSION_TIMEOUT_MINUTES = '30';
      const timeout = getSessionTimeout();
      const expectedTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
      expect(timeout).toBe(expectedTimeout);
      expect(timeout).toBe(1800000);
    });

    test('should handle SESSION_TIMEOUT_MINUTES = 5', () => {
      process.env.SESSION_TIMEOUT_MINUTES = '5';
      const timeout = getSessionTimeout();
      const expectedTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
      expect(timeout).toBe(expectedTimeout);
      expect(timeout).toBe(300000);
    });

    test('should handle SESSION_TIMEOUT_MINUTES = 120', () => {
      process.env.SESSION_TIMEOUT_MINUTES = '120';
      const timeout = getSessionTimeout();
      const expectedTimeout = 120 * 60 * 1000; // 120 minutes in milliseconds
      expect(timeout).toBe(expectedTimeout);
      expect(timeout).toBe(7200000);
    });

    test('should convert minutes to milliseconds correctly', () => {
      process.env.SESSION_TIMEOUT_MINUTES = '60';
      const timeout = getSessionTimeout();
      
      // Verify the conversion: 60 minutes * 60 seconds * 1000 ms
      expect(timeout).toBe(60 * 60 * 1000);
      
      // Not 60 (just minutes without conversion)
      expect(timeout).not.toBe(60);
      
      // Not 3600 (just seconds without milliseconds)
      expect(timeout).not.toBe(3600);
    });
  });

  describe('getSessionConfig', () => {
    test('should return valid session configuration', () => {
      process.env.SESSION_TIMEOUT_MINUTES = '60';
      process.env.SESSION_SECRET = 'test-secret';
      
      const config = getSessionConfig();
      
      expect(config).toHaveProperty('secret');
      expect(config).toHaveProperty('resave');
      expect(config).toHaveProperty('saveUninitialized');
      expect(config).toHaveProperty('cookie');
      expect(config.cookie).toHaveProperty('maxAge');
    });

    test('should set cookie maxAge to session timeout in milliseconds', () => {
      process.env.SESSION_TIMEOUT_MINUTES = '60';
      process.env.SESSION_SECRET = 'test-secret';
      
      const config = getSessionConfig();
      
      // Cookie maxAge should be in milliseconds
      expect(config.cookie.maxAge).toBe(60 * 60 * 1000);
      expect(config.cookie.maxAge).toBe(3600000);
    });

    test('should configure cookie security settings', () => {
      process.env.SESSION_SECRET = 'test-secret';
      const config = getSessionConfig();
      
      expect(config.cookie.httpOnly).toBe(true);
      expect(config.cookie.sameSite).toBe('lax');
    });

    test('should set secure cookie in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SESSION_SECRET = 'secure-production-secret';
      const config = getSessionConfig();
      expect(config.cookie.secure).toBe(true);
    });

    test('should not set secure cookie in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.SESSION_SECRET = 'test-secret';
      const config = getSessionConfig();
      expect(config.cookie.secure).toBe(false);
    });

    test('should throw error in production without SESSION_SECRET', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SESSION_SECRET;
      
      expect(() => getSessionConfig()).toThrow('SESSION_SECRET must be set to a secure value in production');
    });

    test('should throw error in production with default SESSION_SECRET', () => {
      process.env.NODE_ENV = 'production';
      process.env.SESSION_SECRET = 'default-secret-change-me';
      
      expect(() => getSessionConfig()).toThrow('SESSION_SECRET must be set to a secure value in production');
    });

    test('should allow default secret in development with warning', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => getSessionConfig()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Using default session secret')
      );
      
      consoleSpy.mockRestore();
    });
  });
});
