const reportService = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get dashboard executive summary
 * @route   GET /api/manager/reports/summary
 * @access  Private (Manager, Admin)
 */
const getSummary = asyncHandler(async (req, res) => {
  const summary = await reportService.getDashboardSummary(req.user, req.query);

  return successResponse(res, 200, 'Manager summary retrieved successfully', summary);
});

/**
 * @desc    Get sales / revenue report
 * @route   GET /api/manager/reports/sales
 * @access  Private (Manager, Admin)
 */
const getSalesReport = asyncHandler(async (req, res) => {
  const sales = await reportService.getSalesReport(req.user, req.query);

  return successResponse(res, 200, 'Sales report retrieved successfully', sales);
});

/**
 * @desc    Get popular dishes report
 * @route   GET /api/manager/reports/popular-dishes
 * @access  Private (Manager, Admin)
 */
const getPopularDishes = asyncHandler(async (req, res) => {
  const dishes = await reportService.getPopularDishesReport(req.user, req.query);

  return successResponse(res, 200, 'Popular dishes report generated successfully', {
    dishes
  });
});

/**
 * @desc    Get peak order hours report
 * @route   GET /api/manager/reports/peak-hours
 * @access  Private (Manager, Admin)
 */
const getPeakHours = asyncHandler(async (req, res) => {
  const peakHours = await reportService.getPeakHoursReport(req.user, req.query);

  return successResponse(res, 200, 'Peak hours report retrieved successfully', {
    peakHours
  });
});

/**
 * @desc    Get peak reservation hours report
 * @route   GET /api/manager/reports/reservation-peak-hours
 * @access  Private (Manager, Admin)
 */
const getReservationPeakHours = asyncHandler(async (req, res) => {
  const reservationPeakHours = await reportService.getReservationPeakHoursReport(req.user, req.query);

  return successResponse(res, 200, 'Reservation peak hours report retrieved successfully', {
    reservationPeakHours
  });
});

/**
 * @desc    Get ratings and feedback distribution report
 * @route   GET /api/manager/reports/ratings
 * @access  Private (Manager, Admin)
 */
const getRatingsReport = asyncHandler(async (req, res) => {
  const ratings = await reportService.getRatingsReport(req.user, req.query);

  return successResponse(res, 200, 'Ratings analytics retrieved successfully', ratings);
});

module.exports = {
  getSummary,
  getSalesReport,
  getPopularDishes,
  getPeakHours,
  getReservationPeakHours,
  getRatingsReport
};
