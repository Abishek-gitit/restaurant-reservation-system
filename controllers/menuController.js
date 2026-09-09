const MenuItem = require('../models/MenuItem');
const Branch = require('../models/Branch');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new menu item for a branch
 * @route   POST /api/menu
 * @access  Private (Admin, Manager)
 */
const createMenuItem = asyncHandler(async (req, res, next) => {
  const { branchId, name, category, price, isAvailable } = req.body;

  // Validate that the referenced branch exists
  const branchExists = await Branch.findById(branchId);
  if (!branchExists) {
    return next(new AppError('Referenced branch does not exist', 404, 'NOT_FOUND'));
  }

  const menuItem = await MenuItem.create({
    branchId,
    name,
    category,
    price,
    isAvailable: isAvailable !== undefined ? isAvailable : true
  });

  return successResponse(res, 201, 'Menu item created successfully', { menuItem });
});

/**
 * @desc    Get menu items with optional filtering by branchId and category
 * @route   GET /api/menu
 * @access  Public
 */
const getMenuItems = asyncHandler(async (req, res) => {
  const { branchId, category } = req.query;
  const filter = {};

  if (branchId) {
    filter.branchId = branchId;
  }

  if (category) {
    filter.category = new RegExp(`^${category}$`, 'i');
  }

  const menuItems = await MenuItem.find(filter)
    .populate('branchId', 'name address')
    .sort({ category: 1, name: 1 });

  return successResponse(res, 200, 'Menu items retrieved successfully', {
    count: menuItems.length,
    menuItems
  });
});

/**
 * @desc    Get single menu item by ID
 * @route   GET /api/menu/:id
 * @access  Public
 */
const getMenuItemById = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id).populate(
    'branchId',
    'name address'
  );

  if (!menuItem) {
    return next(new AppError('Menu item not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Menu item retrieved successfully', { menuItem });
});

/**
 * @desc    Update menu item
 * @route   PUT /api/menu/:id
 * @access  Private (Admin, Manager)
 */
const updateMenuItem = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { branchId, name, category, price, isAvailable } = req.body;

  if (branchId) {
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return next(new AppError('Referenced branch does not exist', 404, 'NOT_FOUND'));
    }
  }

  const menuItem = await MenuItem.findByIdAndUpdate(
    id,
    { branchId, name, category, price, isAvailable },
    { new: true, runValidators: true }
  ).populate('branchId', 'name address');

  if (!menuItem) {
    return next(new AppError('Menu item not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Menu item updated successfully', { menuItem });
});

/**
 * @desc    Delete menu item
 * @route   DELETE /api/menu/:id
 * @access  Private (Admin, Manager)
 */
const deleteMenuItem = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const menuItem = await MenuItem.findByIdAndDelete(id);

  if (!menuItem) {
    return next(new AppError('Menu item not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Menu item deleted successfully', {
    deletedMenuItemId: id
  });
});

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem
};
