const AppError = require('../utils/appError');

/**
 * Role-based authorization middleware
 * Restricts route access to specified roles
 * @param  {...string} allowedRoles - List of roles permitted to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required.', 401, 'UNAUTHORIZED')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

module.exports = authorize;
