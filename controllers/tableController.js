const Table = require('../models/Table');
const Branch = require('../models/Branch');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new table for a branch
 * @route   POST /api/tables
 * @access  Private (Admin, Manager)
 */
const createTable = asyncHandler(async (req, res, next) => {
  const { branchId, tableNumber, capacity } = req.body;

  // Verify branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    return next(new AppError('Referenced branch does not exist', 404, 'NOT_FOUND'));
  }

  // Check for duplicate tableNumber within the same branch
  const existingTable = await Table.findOne({ branchId, tableNumber });
  if (existingTable) {
    return next(
      new AppError(
        `Table number ${tableNumber} already exists in branch '${branch.name}'.`,
        409,
        'CONFLICT'
      )
    );
  }

  const table = await Table.create({
    branchId,
    tableNumber,
    capacity
  });

  return successResponse(res, 201, 'Table created successfully', { table });
});

/**
 * @desc    Get tables with optional branchId filter
 * @route   GET /api/tables
 * @access  Public (or authenticated)
 */
const getTables = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const filter = {};

  if (branchId) {
    filter.branchId = branchId;
  }

  const tables = await Table.find(filter)
    .populate('branchId', 'name address')
    .sort({ tableNumber: 1 });

  return successResponse(res, 200, 'Tables retrieved successfully', {
    count: tables.length,
    tables
  });
});

/**
 * @desc    Get single table by ID
 * @route   GET /api/tables/:id
 * @access  Public (or authenticated)
 */
const getTableById = asyncHandler(async (req, res, next) => {
  const table = await Table.findById(req.params.id).populate(
    'branchId',
    'name address'
  );

  if (!table) {
    return next(new AppError('Table not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Table retrieved successfully', { table });
});

/**
 * @desc    Update table details
 * @route   PUT /api/tables/:id
 * @access  Private (Admin, Manager)
 */
const updateTable = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { tableNumber, capacity } = req.body;

  const currentTable = await Table.findById(id);
  if (!currentTable) {
    return next(new AppError('Table not found', 404, 'NOT_FOUND'));
  }

  if (tableNumber && tableNumber !== currentTable.tableNumber) {
    const existingTable = await Table.findOne({
      branchId: currentTable.branchId,
      tableNumber,
      _id: { $ne: id }
    });
    if (existingTable) {
      return next(
        new AppError(
          `Table number ${tableNumber} already exists in this branch.`,
          409,
          'CONFLICT'
        )
      );
    }
  }

  const table = await Table.findByIdAndUpdate(
    id,
    { tableNumber, capacity },
    { new: true, runValidators: true }
  ).populate('branchId', 'name address');

  return successResponse(res, 200, 'Table updated successfully', { table });
});

/**
 * @desc    Delete a table
 * @route   DELETE /api/tables/:id
 * @access  Private (Admin, Manager)
 */
const deleteTable = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const table = await Table.findByIdAndDelete(id);

  if (!table) {
    return next(new AppError('Table not found', 404, 'NOT_FOUND'));
  }

  return successResponse(res, 200, 'Table deleted successfully', {
    deletedTableId: id
  });
});

module.exports = {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable
};
