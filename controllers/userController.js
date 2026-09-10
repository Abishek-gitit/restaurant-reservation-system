const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = {};
  if (role) {
    filter.role = role;
  }

  const users = await User.find(filter).sort({ createdAt: -1 });

  return successResponse(res, 200, 'Users retrieved successfully', {
    users: users.map(u => u.toJSON())
  });
});

/**
 * @desc    Create a new user/staff account (Admin only)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, managedBranchIds } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('A user with this email address already exists', 409, 'CONFLICT'));
  }

  const passwordHash = await User.hashPassword(password);

  const newUser = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'customer',
    managedBranchIds: managedBranchIds || []
  });

  return successResponse(res, 201, 'User account created successfully', {
    user: newUser.toJSON()
  });
});

module.exports = {
  getUsers,
  createUser
};
