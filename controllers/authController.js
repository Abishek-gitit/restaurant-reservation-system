const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Register a new customer
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('A user with this email address already exists', 409, 'CONFLICT'));
  }

  const passwordHash = await User.hashPassword(password);

  const newUser = await User.create({
    name,
    email,
    passwordHash,
    role: 'customer' // Customer role is strictly enforced on self-registration
  });

  const token = generateToken(newUser);

  return successResponse(res, 201, 'User registered successfully', {
    user: newUser.toJSON(),
    token
  });
});

/**
 * @desc    Authenticate user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return next(new AppError('Invalid email or password', 401, 'UNAUTHORIZED'));
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new AppError('Invalid email or password', 401, 'UNAUTHORIZED'));
  }

  const token = generateToken(user);

  return successResponse(res, 200, 'Login successful', {
    user: user.toJSON(),
    token
  });
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated users)
 */
const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, 200, 'User profile retrieved successfully', {
    user: req.user.toJSON()
  });
});

module.exports = {
  register,
  login,
  getMe
};
