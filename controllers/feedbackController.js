const feedbackService = require('../services/feedbackService');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Submit feedback for a completed order
 * @route   POST /api/feedback
 * @access  Private (Customer)
 */
const createFeedback = asyncHandler(async (req, res) => {
  const { orderId, rating, comment } = req.body;

  const feedback = await feedbackService.createFeedback(
    { orderId, rating, comment },
    req.user
  );

  return successResponse(res, 201, 'Feedback submitted successfully', {
    feedback
  });
});

/**
 * @desc    Get feedback by ID
 * @route   GET /api/feedback/:id
 * @access  Private (Owner, Manager, Admin)
 */
const getFeedbackById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feedback = await feedbackService.getFeedbackById(id, req.user);

  return successResponse(res, 200, 'Feedback retrieved successfully', {
    feedback
  });
});

/**
 * @desc    Update feedback
 * @route   PUT /api/feedback/:id
 * @access  Private (Owner only)
 */
const updateFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const feedback = await feedbackService.updateFeedback(
    id,
    { rating, comment },
    req.user
  );

  return successResponse(res, 200, 'Feedback updated successfully', {
    feedback
  });
});

/**
 * @desc    Delete feedback
 * @route   DELETE /api/feedback/:id
 * @access  Private (Owner, Admin)
 */
const deleteFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await feedbackService.deleteFeedback(id, req.user);

  return successResponse(res, 200, 'Feedback deleted successfully', {
    id
  });
});

/**
 * @desc    Get feedback associated with an order
 * @route   GET /api/orders/:id/feedback
 * @access  Private (Owner, Manager, Admin)
 */
const getOrderFeedback = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params;

  const feedback = await feedbackService.getFeedbackByOrderId(orderId, req.user);

  return successResponse(res, 200, 'Order feedback retrieved successfully', {
    feedback
  });
});

module.exports = {
  createFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getOrderFeedback
};
