const env = require('../config/env');

/**
 * Calculate authoritative financial totals based on subtotal and order type
 * - taxRate: loaded from central configuration (default: 5%)
 * - serviceChargeRate: loaded from central configuration (default: 5% for DINE_IN, 0% for TAKEAWAY)
 */
const calculateBillingTotals = (subtotal, orderType) => {
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const taxAmount = Math.round((roundedSubtotal * env.taxRate / 100) * 100) / 100;
  const serviceCharge =
    orderType === 'DINE_IN'
      ? Math.round((roundedSubtotal * env.serviceChargeRate / 100) * 100) / 100
      : 0;
  const totalAmount = Math.round((roundedSubtotal + taxAmount + serviceCharge) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    taxRate: env.taxRate,
    taxAmount,
    serviceChargeRate: orderType === 'DINE_IN' ? env.serviceChargeRate : 0,
    serviceCharge,
    totalAmount
  };
};

/**
 * Format itemized bill for an order
 */
const generateBill = (order) => {
  return {
    orderId: order._id ? order._id.toString() : order.id,
    orderType: order.orderType,
    branch: order.branchId
      ? {
          id: order.branchId._id || order.branchId,
          name: order.branchId.name || 'Restaurant Branch',
          address: order.branchId.address || ''
        }
      : null,
    items: order.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal
    })),
    subtotal: order.subtotal,
    taxRate: env.taxRate,
    taxAmount: order.taxAmount,
    serviceChargeRate: order.orderType === 'DINE_IN' ? env.serviceChargeRate : 0,
    serviceCharge: order.serviceCharge,
    totalAmount: order.totalAmount,
    status: order.status,
    billedAt: new Date().toISOString()
  };
};

/**
 * Generate full operational and financial summary of an order
 */
const generateSummary = (order) => {
  return {
    orderId: order._id ? order._id.toString() : order.id,
    customer: order.customerId
      ? {
          id: order.customerId._id || order.customerId,
          name: order.customerId.name || '',
          email: order.customerId.email || ''
        }
      : null,
    branch: order.branchId
      ? {
          id: order.branchId._id || order.branchId,
          name: order.branchId.name || '',
          address: order.branchId.address || ''
        }
      : null,
    table: order.tableId
      ? {
          id: order.tableId._id || order.tableId,
          tableNumber: order.tableId.tableNumber || ''
        }
      : null,
    orderType: order.orderType,
    status: order.status,
    itemCount: order.items ? order.items.length : 0,
    items: order.items,
    financials: {
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      serviceCharge: order.serviceCharge,
      totalAmount: order.totalAmount
    },
    statusHistory: order.statusHistory || [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

module.exports = {
  calculateBillingTotals,
  generateBill,
  generateSummary
};
