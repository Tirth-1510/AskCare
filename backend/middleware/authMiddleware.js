/**
 * authMiddleware.js — JWT Authentication Guard
 *
 * Express middleware that protects routes by verifying the JWT
 * included in the Authorization request header.
 *
 * Usage: Apply this middleware to any router or route that requires
 * the user to be logged in. Example:
 *   router.use(authMiddleware);
 *
 * Token format expected in the request header:
 *   Authorization: Bearer <jwt_token>
 *
 * On success:
 *   - Decodes the token and attaches { id, email } to req.user
 *   - Calls next() to proceed to the route handler
 *
 * On failure:
 *   - Returns HTTP 401 with an appropriate error message
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Must match the secret used when tokens are signed in server.js
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

/**
 * authMiddleware — Validates the Bearer JWT token on each protected request.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function}                   next
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extract the Authorization header value
    const authHeader = req.headers.authorization;

    // Reject requests that have no token or use a non-Bearer scheme
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Split "Bearer <token>" and take the actual token string
    const token = authHeader.split(' ')[1];

    // Verify signature and decode the payload
    // Throws an error if the token is invalid, malformed, or expired
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded user info (id, email) to req.user for downstream handlers
    req.user = {
      id: decoded.id,     // MongoDB ObjectId or local db string id
      email: decoded.email
    };
    
    next(); // Token is valid — continue to the route handler
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

module.exports = authMiddleware;
