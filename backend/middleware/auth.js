const jwt = require('jsonwebtoken');

const JWT_SECRET = "12345";

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('Auth Middleware - Full headers:', JSON.stringify(req.headers, null, 2)); // Debug log

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth Middleware - No token or invalid format');
      return res.status(401).json({ error: 'No token provided or invalid format.' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Auth Middleware - Token extracted:', token.substring(0, 20) + '...');

    // Verify token
    const decodedToken = jwt.verify(token, JWT_SECRET);
    console.log('Auth Middleware - Token verified, userId:', decodedToken.userId);

    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    console.error("Auth Middleware - JWT ERROR:", error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    res.status(401).json({ error: 'Authentication failed. Invalid token.' });
  }
};