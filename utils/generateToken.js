const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate signed JWT for authenticated user
 * Contains only non-sensitive identity information (userId, role)
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
};

module.exports = generateToken;
