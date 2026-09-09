const Reservation = require('../models/Reservation');
const {
  validateTableAndBranch,
  checkConflict,
  validateStatusTransition,
  cancelReservationWithPolicy,
  rescheduleReservationAtomic
} = require('../services/reservationService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new table reservation
 * @route   POST /api/reservations
 * @access  Private (Customer, Manager, Admin)
 */
const createReservation = asyncHandler(async (req, res, next) => {
  const { branchId, tableId, dateTime, duration = 90 } = req.body;
  const customerId = req.user._id;

  // 1. Verify that branch and table exist, and table belongs to branch
  const { branch, table } = await validateTableAndBranch(branchId, tableId);

  // 2. Perform Conflict Check (End-time exclusivity)
  const conflict = await checkConflict(tableId, dateTime, duration);
  if (conflict) {
    return next(
      new AppError(
        `Table is already reserved for the selected time slot`,
        409,
        'RESERVATION_CONFLICT'
      )
    );
  }

  // 3. Calculate endTime
  const reservationStart = new Date(dateTime);
  const reservationEnd = new Date(reservationStart.getTime() + duration * 60000);

  // 4. Create Reservation
  const reservation = await Reservation.create({
    customerId,
    branchId,
    tableId,
    dateTime: reservationStart,
    duration,
    endTime: reservationEnd,
    status: 'CONFIRMED',
    statusHistory: [
      {
        status: 'CONFIRMED',
        changedBy: customerId,
        changedAt: new Date(),
        remarks: 'Reservation created'
      }
    ]
  });

  const populated = await Reservation.findById(reservation._id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  return successResponse(res, 201, 'Reservation created successfully', {
    reservation: populated
  });
});

/**
 * @desc    Get reservations with filtering and ownership enforcement
 * @route   GET /api/reservations
 * @access  Private
 */
const getReservations = asyncHandler(async (req, res) => {
  const { branchId, tableId, status, date, customerId } = req.query;
  const filter = {};

  // Ownership: Customers can only see their own reservations
  if (req.user.role === 'customer') {
    filter.customerId = req.user._id;
  } else if (customerId) {
    filter.customerId = customerId;
  }

  if (branchId) filter.branchId = branchId;
  if (tableId) filter.tableId = tableId;
  if (status) filter.status = status;

  if (date) {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    filter.dateTime = { $gte: startDate, $lte: endDate };
  }

  const reservations = await Reservation.find(filter)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity')
    .sort({ dateTime: -1 });

  return successResponse(res, 200, 'Reservations retrieved successfully', {
    count: reservations.length,
    reservations
  });
});

/**
 * @desc    Get single reservation by ID
 * @route   GET /api/reservations/:id
 * @access  Private
 */
const getReservationById = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  if (!reservation) {
    return next(new AppError('Reservation not found', 404, 'NOT_FOUND'));
  }

  // Security / Ownership check
  if (
    req.user.role === 'customer' &&
    reservation.customerId._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError(
        'You do not have permission to view this reservation',
        403,
        'FORBIDDEN'
      )
    );
  }

  return successResponse(res, 200, 'Reservation retrieved successfully', {
    reservation
  });
});

/**
 * @desc    Update or reschedule reservation
 * @route   PUT /api/reservations/:id
 * @access  Private
 */
const updateReservation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { dateTime, duration, status } = req.body;

  const reservation = await Reservation.findById(id);
  if (!reservation) {
    return next(new AppError('Reservation not found', 404, 'NOT_FOUND'));
  }

  // Ownership check
  if (
    req.user.role === 'customer' &&
    reservation.customerId.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError(
        'You do not have permission to modify this reservation',
        403,
        'FORBIDDEN'
      )
    );
  }

  // Customer cannot mark status as COMPLETED
  if (req.user.role === 'customer' && status && status === 'COMPLETED') {
    return next(
      new AppError(
        'Customers cannot mark reservations as completed',
        403,
        'FORBIDDEN'
      )
    );
  }

  // Handle status transition
  if (status) {
    validateStatusTransition(reservation.status, status);
    reservation.status = status;
  }

  // Handle rescheduling
  if (dateTime || duration) {
    if (['CANCELLED', 'COMPLETED'].includes(reservation.status)) {
      return next(
        new AppError(
          `Cannot reschedule a ${reservation.status.toLowerCase()} reservation`,
          400,
          'BAD_REQUEST'
        )
      );
    }

    const newStart = dateTime ? new Date(dateTime) : reservation.dateTime;
    const newDuration = duration ? parseInt(duration, 10) : reservation.duration;

    // Check conflict excluding current reservation
    const conflict = await checkConflict(
      reservation.tableId,
      newStart,
      newDuration,
      reservation._id
    );

    if (conflict) {
      return next(
        new AppError(
          'Table is already reserved for the selected time slot',
          409,
          'RESERVATION_CONFLICT'
        )
      );
    }

    reservation.dateTime = newStart;
    reservation.duration = newDuration;
    reservation.endTime = new Date(newStart.getTime() + newDuration * 60000);
  }

  await reservation.save();

  const updated = await Reservation.findById(id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  return successResponse(res, 200, 'Reservation updated successfully', {
    reservation: updated
  });
});

/**
 * @desc    Cancel a reservation with 2-hour policy enforcement
 * @route   PUT /api/reservations/:id/cancel or DELETE /api/reservations/:id
 * @access  Private
 */
const cancelReservation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const remarks = req.body && req.body.remarks ? req.body.remarks : '';

  const reservation = await Reservation.findById(id);
  if (!reservation) {
    return next(new AppError('Reservation not found', 404, 'NOT_FOUND'));
  }

  const cancelled = await cancelReservationWithPolicy(reservation, req.user, remarks);

  return successResponse(res, 200, 'Reservation cancelled successfully', {
    reservationId: id,
    status: 'CANCELLED',
    reservation: cancelled
  });
});

/**
 * @desc    Reschedule a reservation atomically
 * @route   PUT /api/reservations/:id/reschedule
 * @access  Private
 */
const rescheduleReservation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { dateTime, duration, remarks } = req.body;

  const reservation = await Reservation.findById(id);
  if (!reservation) {
    return next(new AppError('Reservation not found', 404, 'NOT_FOUND'));
  }

  const updated = await rescheduleReservationAtomic(
    reservation,
    dateTime,
    duration,
    req.user,
    remarks
  );

  const populated = await Reservation.findById(updated._id)
    .populate('customerId', 'name email')
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity');

  return successResponse(res, 200, 'Reservation rescheduled successfully', {
    reservation: populated
  });
});

/**
 * @desc    Get reservation history for a specific customer
 * @route   GET /api/customers/:id/reservations
 * @access  Private
 */
const getCustomerReservations = asyncHandler(async (req, res, next) => {
  const id = req.params.id || req.user._id.toString();

  // Ownership check
  if (req.user.role === 'customer' && id !== req.user._id.toString()) {
    return next(
      new AppError(
        'You do not have permission to view reservations for this customer',
        403,
        'FORBIDDEN'
      )
    );
  }

  const filter = { customerId: id };

  if (req.query.branchId) {
    filter.branchId = req.query.branchId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.from || req.query.to) {
    filter.dateTime = {};
    if (req.query.from) {
      const fromDate = new Date(req.query.from);
      if (isNaN(fromDate.getTime())) {
        return next(new AppError('Invalid from date format', 400, 'INVALID_DATE_RANGE'));
      }
      fromDate.setUTCHours(0, 0, 0, 0);
      filter.dateTime.$gte = fromDate;
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      if (isNaN(toDate.getTime())) {
        return next(new AppError('Invalid to date format', 400, 'INVALID_DATE_RANGE'));
      }
      toDate.setUTCHours(23, 59, 59, 999);
      filter.dateTime.$lte = toDate;
    }
    if (filter.dateTime.$gte && filter.dateTime.$lte && filter.dateTime.$gte > filter.dateTime.$lte) {
      return next(new AppError('From date must be earlier than or equal to to date', 400, 'INVALID_DATE_RANGE'));
    }
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const total = await Reservation.countDocuments(filter);
  const totalPages = Math.ceil(total / limit) || 0;

  const reservations = await Reservation.find(filter)
    .populate('branchId', 'name address')
    .populate('tableId', 'tableNumber capacity')
    .sort({ dateTime: -1 })
    .skip(skip)
    .limit(limit);

  return successResponse(
    res,
    200,
    'Customer reservations retrieved successfully',
    {
      count: reservations.length,
      reservations,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  );
});

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  rescheduleReservation,
  getCustomerReservations
};
