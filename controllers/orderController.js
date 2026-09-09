const Order = require('../models/Order');
const {
  validateOrderBranchAndTable,
  processOrderItems,
  validateAndTransitionOrderStatus
} = require('../services/orderService');
const { generateBill, generateSummary } = require('../services/billingService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Place a new food order
 * @route   POST /api/orders
 * @access  Private (Customer, Manager, Admin)
 */
const createOrder = asyncHandler(async (req, res, next) => {
  const { branchId, orderType, tableId, reservationId, items } = req.body;
  const customerId = req.user._id;

  // 1. Validate branch and optional table/reservation
  await validateOrderBranchAndTable({ branchId, orderType, tableId, reservationId });

  // 2. Validate menu items and calculate authoritative totals server-side
  const { embeddedItems, subtotal, taxAmount, serviceCharge, totalAmount } =
    await processOrderItems(branchId, items, orderType);

  // 3. Create the Order with embedded item snapshots and initial statusHistory
  const order = await Order.create({
    customerId,
    branchId,
    orderType,
    tableId: tableId || null,
    reservationId: reservationId || null,
    items: embeddedItems,
    status: 'PLACED',
    statusHistory: [
      {
        status: 'PLACED',
        changedBy: customerId,
        changedAt: new Date(),
        remarks: 'Order placed by customer'
      }
    ],
    subtotal,
    taxAmount,
    serviceCharge,
    totalAmount
  });

  const populated = await Order.findById(order._id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  return successResponse(res, 201, 'Order placed successfully', {
    order: populated
  });
});

/**
 * @desc    Get orders with filtering and ownership enforcement
 * @route   GET /api/orders
 * @access  Private
 */
const getOrders = asyncHandler(async (req, res) => {
  const { branchId, status, orderType, date, customerId } = req.query;
  const filter = {};

  // Ownership: Customers see only their own orders
  if (req.user.role === 'customer') {
    filter.customerId = req.user._id;
  } else if (customerId) {
    filter.customerId = customerId;
  }

  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;
  if (orderType) filter.orderType = orderType;

  if (date) {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    filter.createdAt = { $gte: startDate, $lte: endDate };
  }

  const orders = await Order.find(filter)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity')
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Orders retrieved successfully', {
    count: orders.length,
    orders
  });
});

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  if (!order) {
    return next(new AppError('Order not found', 404, 'NOT_FOUND'));
  }

  // Ownership check
  if (
    req.user.role === 'customer' &&
    order.customerId._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError('You do not have permission to view this order', 403, 'FORBIDDEN')
    );
  }

  return successResponse(res, 200, 'Order retrieved successfully', { order });
});

/**
 * @desc    Update order status via strict state machine
 * @route   PUT /api/orders/:id/status
 * @route   PATCH /api/orders/:id/status
 * @access  Private (Staff: Kitchen, Manager, Admin)
 */
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('Order not found', 404, 'NOT_FOUND'));
  }

  // Execute state machine transition
  await validateAndTransitionOrderStatus(order, status, req.user, remarks);

  const populated = await Order.findById(id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  return successResponse(res, 200, 'Order status updated successfully', {
    status: populated.status,
    order: populated
  });
});

/**
 * @desc    Get itemized bill for an order
 * @route   GET /api/orders/:id/bill
 * @access  Private (Customer, Manager, Admin)
 */
const getOrderBill = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Kitchen staff should not have access to financial billing details
  if (req.user.role === 'kitchen') {
    return next(
      new AppError('Kitchen staff cannot view financial billing information', 403, 'FORBIDDEN')
    );
  }

  const order = await Order.findById(id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address');

  if (!order) {
    return next(new AppError('Order not found', 404, 'NOT_FOUND'));
  }

  // Ownership check for customers
  if (
    req.user.role === 'customer' &&
    order.customerId._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError('You do not have permission to view this bill', 403, 'FORBIDDEN')
    );
  }

  const bill = generateBill(order);

  return successResponse(res, 200, 'Bill generated successfully', {
    ...bill,
    bill
  });
});

/**
 * @desc    Get order overview and fulfillment summary
 * @route   GET /api/orders/:id/summary
 * @access  Private (Customer, Manager, Admin)
 */
const getOrderSummary = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (req.user.role === 'kitchen') {
    return next(
      new AppError('Kitchen staff cannot view order summary financials', 403, 'FORBIDDEN')
    );
  }

  const order = await Order.findById(id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  if (!order) {
    return next(new AppError('Order not found', 404, 'NOT_FOUND'));
  }

  // Ownership check for customers
  if (
    req.user.role === 'customer' &&
    order.customerId._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError('You do not have permission to view this order summary', 403, 'FORBIDDEN')
    );
  }

  const summary = generateSummary(order);

  return successResponse(res, 200, 'Order summary retrieved successfully', {
    ...summary,
    summary
  });
});

/**
 * @desc    Get customer order history
 * @route   GET /api/customers/:id/orders
 * @access  Private
 */
const getCustomerOrders = asyncHandler(async (req, res, next) => {
  const id = req.params.id || req.user._id.toString();

  // Ownership check
  if (req.user.role === 'customer' && id !== req.user._id.toString()) {
    return next(
      new AppError('You do not have permission to view orders for this customer', 403, 'FORBIDDEN')
    );
  }

  const filter = { customerId: id };

  if (req.query.branchId) {
    filter.branchId = req.query.branchId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.orderType) {
    filter.orderType = req.query.orderType;
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) {
      const fromDate = new Date(req.query.from);
      if (isNaN(fromDate.getTime())) {
        return next(new AppError('Invalid from date format', 400, 'INVALID_DATE_RANGE'));
      }
      fromDate.setUTCHours(0, 0, 0, 0);
      filter.createdAt.$gte = fromDate;
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      if (isNaN(toDate.getTime())) {
        return next(new AppError('Invalid to date format', 400, 'INVALID_DATE_RANGE'));
      }
      toDate.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
    if (filter.createdAt.$gte && filter.createdAt.$lte && filter.createdAt.$gte > filter.createdAt.$lte) {
      return next(new AppError('From date must be earlier than or equal to to date', 400, 'INVALID_DATE_RANGE'));
    }
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const total = await Order.countDocuments(filter);
  const totalPages = Math.ceil(total / limit) || 0;

  const orders = await Order.find(filter)
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return successResponse(res, 200, 'Customer orders retrieved successfully', {
    count: orders.length,
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderBill,
  getOrderSummary,
  getCustomerOrders
};
