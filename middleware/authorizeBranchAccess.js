const AppError = require('../utils/appError');

/**
 * Pure authorization check for branch-scoped access
 * Admin: system-wide access to all branches
 * Manager: only assigned branches in user.managedBranchIds
 */
const checkBranchPermission = (user, branchId) => {
  if (!user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'manager') {
    if (!branchId) {
      return true;
    }

    const assignedIds = Array.isArray(user.managedBranchIds)
      ? user.managedBranchIds.map((id) => (id._id ? id._id.toString() : id.toString()))
      : [];

    const targetBranchId = branchId._id ? branchId._id.toString() : branchId.toString();

    // If manager has assigned branches, target must be among them
    if (assignedIds.length > 0 && !assignedIds.includes(targetBranchId)) {
      throw new AppError(
        'You do not have management permission for this branch',
        403,
        'BRANCH_ACCESS_DENIED'
      );
    }

    return true;
  }

  throw new AppError(
    'You do not have permission to perform branch management operations',
    403,
    'FORBIDDEN'
  );
};

/**
 * Express middleware for branch-scoped access
 */
const authorizeBranchAccess = (getBranchId = (req) => req.params.id || req.query.branchId || req.body.branchId) => {
  return (req, res, next) => {
    try {
      const branchId = getBranchId(req);
      checkBranchPermission(req.user, branchId);
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  checkBranchPermission,
  authorizeBranchAccess
};
