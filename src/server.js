const express = require('express');
const session = require('express-session');
const { getSessionConfig } = require('./session-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with proper configuration
app.use(session(getSessionConfig()));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'FinOps Demo Application',
    description: 'Dashboard de custos com integração Azure'
  });
});

// Login route (demo)
app.post('/login', (req, res) => {
  req.session.user = {
    id: 1,
    username: 'demo-user',
    loginTime: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Login successful',
    sessionTimeout: req.session.cookie.maxAge,
    user: req.session.user
  });
});

// Protected route to check session
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.'
    });
  }
  
  res.json({
    success: true,
    message: 'Welcome to FinOps Dashboard',
    user: req.session.user,
    sessionAge: Date.now() - new Date(req.session.user.loginTime).getTime(),
    sessionMaxAge: req.session.cookie.maxAge
  });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Session info route (for debugging)
app.get('/session-info', (req, res) => {
  res.json({
    hasSession: !!req.session.user,
    sessionTimeout: req.session.cookie.maxAge,
    sessionTimeoutMinutes: req.session.cookie.maxAge / (60 * 1000),
    user: req.session.user || null
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FinOps Demo Application running on port ${PORT}`);
    console.log(`Session timeout: ${process.env.SESSION_TIMEOUT_MINUTES || 60} minutes`);
  });
}

module.exports = app;
