const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const AppError = require('../utils/appError');
const { checkBranchPermission } = require('../middleware/authorizeBranchAccess');

/**
 * Submit feedback for a completed order
 */
const createFeedback = async ({ orderId, rating, comment }, user) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Referenced order does not exist', 404, 'ORDER_NOT_FOUND');
  }

  // Ownership verification: Customer can only submit feedback for their own order
  if (user.role === 'customer' && order.customerId.toString() !== user._id.toString()) {
    throw new AppError(
      'You cannot submit feedback for an order that does not belong to you',
      403,
      'FEEDBACK_NOT_ALLOWED'
    );
  }

  // Completed order requirement: only SERVED (Dine-In) or DELIVERED (Takeaway) orders are eligible
  const isCompleted =
    (order.orderType === 'DINE_IN' && order.status === 'SERVED') ||
    (order.orderType === 'TAKEAWAY' && order.status === 'DELIVERED');

  if (!isCompleted) {
    throw new AppError(
      `Feedback can only be submitted for completed orders (${order.orderType === 'DINE_IN' ? 'SERVED' : 'DELIVERED'}). Current status is '${order.status}'.`,
      409,
      'ORDER_NOT_ELIGIBLE_FOR_FEEDBACK'
    );
  }

  // Enforce one feedback per order
  const existingFeedback = await Feedback.findOne({
    orderId,
    customerId: user._id
  });

  if (existingFeedback) {
    throw new AppError(
      'Feedback has already been submitted for this order',
      409,
      'FEEDBACK_ALREADY_EXISTS'
    );
  }

  const feedback = await Feedback.create({
    orderId,
    customerId: user._id,
    branchId: order.branchId,
    rating,
    comment: (comment || '').trim()
  });

  return feedback;
};

/**
 * Retrieve feedback by ID with ownership/manager scoping
 */
const getFeedbackById = async (id, user) => {
  const feedback = await Feedback.findById(id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('orderId', 'orderType status totalAmount items');

  if (!feedback) {
    throw new AppError('Feedback not found', 404, 'NOT_FOUND');
  }

  if (
    user.role === 'customer' &&
    feedback.customerId._id.toString() !== user._id.toString()
  ) {
    throw new AppError('You do not have permission to view this feedback', 403, 'FORBIDDEN');
  }

  if (user.role === 'manager') {
    checkBranchPermission(user, feedback.branchId._id || feedback.branchId);
  }

  return feedback;
};

/**
 * Update rating or comment on existing feedback (Owner only)
 */
const updateFeedback = async (id, { rating, comment }, user) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new AppError('Feedback not found', 404, 'NOT_FOUND');
  }

  if (feedback.customerId.toString() !== user._id.toString()) {
    throw new AppError('You do not have permission to update this feedback', 403, 'FORBIDDEN');
  }

  if (rating !== undefined) {
    feedback.rating = rating;
  }
  if (comment !== undefined) {
    feedback.comment = comment.trim();
  }

  await feedback.save();
  return feedback;
};

/**
 * Delete feedback (Owner or Admin)
 */
const deleteFeedback = async (id, user) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new AppError('Feedback not found', 404, 'NOT_FOUND');
  }

  if (user.role !== 'admin' && feedback.customerId.toString() !== user._id.toString()) {
    throw new AppError('You do not have permission to delete this feedback', 403, 'FORBIDDEN');
  }

  await feedback.deleteOne();
  return { id };
};

/**
 * Retrieve feedback associated with an order
 */
const getFeedbackByOrderId = async (orderId, user) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404, 'NOT_FOUND');
  }

  if (user.role === 'customer' && order.customerId.toString() !== user._id.toString()) {
    throw new AppError('You do not have permission to view feedback for this order', 403, 'FORBIDDEN');
  }

  if (user.role === 'manager') {
    checkBranchPermission(user, order.branchId);
  }

  const feedback = await Feedback.findOne({ orderId })
    .populate('customerId', 'name email')
    .populate('branchId', 'name');

  if (!feedback) {
    throw new AppError('No feedback found for this order', 404, 'NOT_FOUND');
  }

  return feedback;
};

module.exports = {
  createFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getFeedbackByOrderId
};
