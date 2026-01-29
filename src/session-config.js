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
  return {
    secret: process.env.SESSION_SECRET || 'default-secret-change-me',
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
