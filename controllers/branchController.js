const Branch = require('../models/Branch');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new restaurant branch
 * @route   POST /api/branches
 * @access  Private (Admin, Manager)
 */
const createBranch = asyncHandler(async (req, res, next) => {
  const { name, address, seatingCapacity } = req.body;

  const existingBranch = await Branch.findOne({ name });
  if (existingBranch) {
    return next(
      new AppError(
        `A branch with name '${name}' already exists.`,
        409,
        'CONFLICT'
      )
    );
  }

  const branch = await Branch.create({
    name,
    address,
    seatingCapacity
  });

  return successResponse(res, 201, 'Branch created successfully', { branch });
});

/**
 * @desc    Get all branches
 * @route   GET /api/branches
 * @access  Public
 */
const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find().sort({ createdAt: -1 });

  return successResponse(res, 200, 'Branches retrieved successfully', {
    count: branches.length,
    branches
  });
});

/**
 * @desc    Get single branch by ID
 * @route   GET /api/branches/:id
 * @access  Public
 */
const getBranchById = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findById(req.params.id);

  if (!branch) {
    return next(new AppError('Branch not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Branch retrieved successfully', { branch });
});

/**
 * @desc    Update branch details
 * @route   PUT /api/branches/:id
 * @access  Private (Admin, Manager)
 */
const updateBranch = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, address, seatingCapacity } = req.body;

  if (name) {
    const existingBranch = await Branch.findOne({
      name,
      _id: { $ne: id }
    });
    if (existingBranch) {
      return next(
        new AppError(
          `Another branch with name '${name}' already exists.`,
          409,
          'CONFLICT'
        )
      );
    }
  }

  const branch = await Branch.findByIdAndUpdate(
    id,
    { name, address, seatingCapacity },
    { new: true, runValidators: true }
  );

  if (!branch) {
    return next(new AppError('Branch not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Branch updated successfully', { branch });
});

/**
 * @desc    Delete a branch and associated inventory
 * @route   DELETE /api/branches/:id
 * @access  Private (Admin, Manager)
 */
const deleteBranch = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const branch = await Branch.findByIdAndDelete(id);

  if (!branch) {
    return next(new AppError('Branch not found', 404, 'NOT_FOUND'));
  }

  // Clean up associated menu items and tables to maintain referential integrity
  await MenuItem.deleteMany({ branchId: id });
  await Table.deleteMany({ branchId: id });

  return successResponse(res, 200, 'Branch and associated inventory deleted successfully', {
    deletedBranchId: id
  });
});

/**
 * @desc    Activate or deactivate a restaurant branch
 * @route   PUT /api/branches/:id/status
 * @access  Private (Admin, Manager)
 */
const updateBranchStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const branch = await Branch.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!branch) {
    return next(new AppError('Branch not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Branch status updated successfully', { branch });
});

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  updateBranchStatus
};

