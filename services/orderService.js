const Branch = require('../models/Branch');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Reservation = require('../models/Reservation');
const { calculateBillingTotals } = require('./billingService');
const AppError = require('../utils/appError');

/**
 * Validate order branch and optional dine-in table or reservation
 */
const validateOrderBranchAndTable = async ({ branchId, orderType, tableId, reservationId }) => {
  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new AppError('Referenced branch does not exist', 404, 'NOT_FOUND');
  }

  if (branch.isActive === false) {
    throw new AppError('This restaurant branch is currently inactive', 409, 'BRANCH_INACTIVE');
  }

  if (tableId) {
    const table = await Table.findById(tableId);
    if (!table) {
      throw new AppError('Referenced table does not exist', 404, 'NOT_FOUND');
    }
    if (table.branchId.toString() !== branchId.toString()) {
      throw new AppError(
        `Table ${table.tableNumber} does not belong to branch '${branch.name}'`,
        400,
        'BAD_REQUEST'
      );
    }
  }

  if (reservationId) {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new AppError('Referenced reservation does not exist', 404, 'NOT_FOUND');
    }
    if (reservation.branchId.toString() !== branchId.toString()) {
      throw new AppError(
        'Referenced reservation does not belong to this branch',
        400,
        'BAD_REQUEST'
      );
    }
  }

  return { branch };
};

/**
 * Validate order items against live database, check availability,
 * and calculate authoritative prices and totals server-side.
 */
const processOrderItems = async (branchId, requestedItems, orderType = 'DINE_IN') => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    throw new AppError('Order must contain at least one item', 400, 'VALIDATION_ERROR');
  }

  const embeddedItems = [];
  let subtotal = 0;

  for (const item of requestedItems) {
    const menuItem = await MenuItem.findById(item.menuItemId);
    if (!menuItem) {
      throw new AppError(`Menu item with ID '${item.menuItemId}' does not exist`, 404, 'NOT_FOUND');
    }

    // Ensure menu item belongs to the selected branch
    if (menuItem.branchId.toString() !== branchId.toString()) {
      throw new AppError(
        `Menu item '${menuItem.name}' does not belong to the selected branch`,
        400,
        'BAD_REQUEST'
      );
    }

    // Check item availability
    if (!menuItem.isAvailable) {
      throw new AppError(
        `Menu item '${menuItem.name}' is currently unavailable`,
        400,
        'ITEM_UNAVAILABLE'
      );
    }

    const quantity = parseInt(item.quantity, 10);
    if (isNaN(quantity) || quantity <= 0 || quantity > 50) {
      throw new AppError(
        `Invalid quantity for '${menuItem.name}'. Quantity must be between 1 and 50.`,
        400,
        'VALIDATION_ERROR'
      );
    }

    const unitPrice = menuItem.price;
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

    embeddedItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      unitPrice,
      quantity,
      lineTotal
    });

    subtotal += lineTotal;
  }

  // Authoritative server-side calculation via billing service
  const billing = calculateBillingTotals(subtotal, orderType);

  return {
    embeddedItems,
    subtotal: billing.subtotal,
    taxAmount: billing.taxAmount,
    serviceCharge: billing.serviceCharge,
    totalAmount: billing.totalAmount
  };
};

/**
 * Strict state machine for order lifecycle transitions
 * PLACED -> PREPARING (Kitchen, Manager, Admin)
 * PLACED -> CANCELLED (Manager, Admin, or Customer prior to preparation)
 * PREPARING -> READY (Kitchen, Manager, Admin)
 * READY -> SERVED (DINE_IN only; Manager, Admin, Kitchen)
 * READY -> DELIVERED (TAKEAWAY only; Manager, Admin, Kitchen)
 */
const validateAndTransitionOrderStatus = async (order, newStatus, user, remarks = '') => {
  const currentStatus = order.status;

  if (currentStatus === newStatus) {
    return order;
  }

  // Customer cannot change status through staff workflow
  if (user.role === 'customer') {
    throw new AppError(
      'Customers do not have permission to update order status',
      403,
      'FORBIDDEN'
    );
  }

  // Define allowed transitions
  const allowedTransitions = {
    PLACED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: order.orderType === 'DINE_IN' ? ['SERVED'] : ['DELIVERED'],
    SERVED: [],
    DELIVERED: [],
    CANCELLED: []
  };

  const permitted = allowedTransitions[currentStatus] || [];
  if (!permitted.includes(newStatus)) {
    // Check if moving to wrong fulfillment state for orderType
    if (currentStatus === 'READY') {
      if (order.orderType === 'DINE_IN' && newStatus === 'DELIVERED') {
        throw new AppError(
          'Dine-in orders must be marked as SERVED, not DELIVERED',
          409,
          'INVALID_STATUS_TRANSITION'
        );
      }
      if (order.orderType === 'TAKEAWAY' && newStatus === 'SERVED') {
        throw new AppError(
          'Takeaway orders must be marked as DELIVERED, not SERVED',
          409,
          'INVALID_STATUS_TRANSITION'
        );
      }
    }
    throw new AppError(
      `Invalid order status transition from ${currentStatus} to ${newStatus}`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Role permissions on transitions
  if (user.role === 'kitchen') {
    // Kitchen staff can advance PLACED -> PREPARING and PREPARING -> READY
    if (!['PREPARING', 'READY'].includes(newStatus)) {
      throw new AppError(
        'Kitchen staff can only update order status to PREPARING or READY',
        403,
        'FORBIDDEN'
      );
    }
  }

  // Update status and append audit history
  order.status = newStatus;
  order.statusHistory.push({
    status: newStatus,
    changedBy: user._id,
    changedAt: new Date(),
    remarks: remarks || `Status changed from ${currentStatus} to ${newStatus}`
  });

  await order.save();
  return order;
};

module.exports = {
  validateOrderBranchAndTable,
  processOrderItems,
  validateAndTransitionOrderStatus
};
