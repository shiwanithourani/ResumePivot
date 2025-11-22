// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided or invalid format.' });
    }

    // split and take the token string
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Invalid authorization header.' });
    }
    const token = parts[1];

    // verify token (throws if invalid/expired)
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || !decodedToken.userId) {
      return res.status(401).json({ error: 'Authentication failed. Invalid token payload.' });
    }

    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed. Invalid token.' });
  }
};
