require('dotenv').config();

/**
 * Session configuration module
 * 
 * This module configures the session timeout based on the SESSION_TIMEOUT_MINUTES
 * environment variable. The default is 60 minutes if not specified.
 * 
 * IMPORTANT: express-session expects maxAge in milliseconds
 */

/**
 * Get session timeout in milliseconds
 * @returns {number} Session timeout in milliseconds
 */
function getSessionTimeout() {
  // Read from environment variable, default to 60 minutes
  const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60', 10);
  
  // Convert minutes to milliseconds
  // This is critical: express-session maxAge is in milliseconds, not minutes
  const timeoutMilliseconds = timeoutMinutes * 60 * 1000;
  
  return timeoutMilliseconds;
}

/**
 * Get session configuration for express-session
 * @returns {Object} Session configuration object
 */
function getSessionConfig() {
  const secret = process.env.SESSION_SECRET || 'default-secret-change-me';
  
  // Security check: Refuse to start in production without a proper secret
  if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || secret === 'default-secret-change-me')) {
    throw new Error('SESSION_SECRET must be set to a secure value in production');
  }
  
  // Warn in development if using default secret
  if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: Using default session secret. Set SESSION_SECRET environment variable for security.');
  }
  
  return {
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: getSessionTimeout(), // Session timeout in milliseconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  };
}

module.exports = {
  getSessionTimeout,
  getSessionConfig
};
