const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get pending kitchen order queue (FIFO: oldest first)
 * @route   GET /api/kitchen/orders
 * @access  Private (Kitchen, Manager, Admin)
 */
const getKitchenQueue = asyncHandler(async (req, res) => {
  const { branchId, status, orderType } = req.query;

  const filter = {};

  // Kitchen queue strictly tracks active prep states
  if (status && ['PLACED', 'PREPARING'].includes(status)) {
    filter.status = status;
  } else {
    filter.status = { $in: ['PLACED', 'PREPARING'] };
  }

  if (branchId) {
    filter.branchId = branchId;
  }

  if (orderType) {
    filter.orderType = orderType;
  }

  // FIFO Queue: sorted by createdAt ASC (oldest first)
  const orders = await Order.find(filter)
    .populate('branchId', 'name')
    .populate('tableId', 'tableNumber')
    .sort({ createdAt: 1 });

  // Sanitize kitchen display payload (omit sensitive customer/financial data)
  const queueItems = orders.map((order) => ({
    id: order._id.toString(),
    branch: order.branchId ? order.branchId.name : null,
    orderType: order.orderType,
    tableNumber: order.tableId ? order.tableId.tableNumber : null,
    status: order.status,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity
    })),
    createdAt: order.createdAt
  }));

  return successResponse(res, 200, 'Kitchen queue retrieved successfully', {
    count: queueItems.length,
    orders: queueItems
  });
});

module.exports = {
  getKitchenQueue
};
