const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const auth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED')
    );
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token no longer exists.',
          401,
          'UNAUTHORIZED'
        )
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please log in again.', 401, 'UNAUTHORIZED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'UNAUTHORIZED'));
  }
});

module.exports = auth;
