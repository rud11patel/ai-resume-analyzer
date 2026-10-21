const jwt = require('jsonwebtoken');
const { validateEnv } = require('../config/env');
const User = require('../models/User');

const env = validateEnv();

/**
 * Signs a JWT token containing the user's ID and email.
 * @param {object} user - Mongoose User document or plain object with _id/id and email
 * @returns {string} Signed JWT
 */
function generateToken(user) {
  const userId = user._id || user.id;
  return jwt.sign(
    { userId: userId.toString(), email: user.email, role: user.role || 'user' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * Express middleware to authenticate requests via HTTP-only cookie or Bearer token header.
 */
async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fall back to HTTP-only cookie if header is absent
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. No valid token found in request.',
          statusCode: 401,
        },
      });
    }

    // 3. Verify JWT token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtErr) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        error: {
          message: isExpired ? 'Session expired. Please sign in again.' : 'Invalid authentication token.',
          statusCode: 401,
        },
      });
    }

    // 4. Verify user exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'The account associated with this session no longer exists.',
          statusCode: 401,
        },
      });
    }

    // 5. Attach authenticated user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  generateToken,
};
