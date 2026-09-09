const Reservation = require('../models/Reservation');
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const AppError = require('../utils/appError');

/**
 * Validate that branch and table exist, and that the table belongs to the specified branch
 */
const validateTableAndBranch = async (branchId, tableId) => {
  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new AppError('Referenced branch does not exist', 404, 'NOT_FOUND');
  }

  if (branch.isActive === false) {
    throw new AppError('This restaurant branch is currently inactive', 409, 'BRANCH_INACTIVE');
  }

  const table = await Table.findById(tableId);
  if (!table) {
    throw new AppError('Referenced table does not exist', 404, 'NOT_FOUND');
  }

  if (table.branchId.toString() !== branchId.toString()) {
    throw new AppError(
      `Table number ${table.tableNumber} does not belong to branch '${branch.name}'`,
      400,
      'BAD_REQUEST'
    );
  }

  return { branch, table };
};

/**
 * Detect reservation conflicts on the same table with end-time exclusivity.
 * An active reservation overlaps if and only if:
 *   existing.dateTime < newEnd  AND  existing.endTime > newStart
 * Cancelled reservations are excluded.
 */
const checkConflict = async (tableId, startDateTime, durationMinutes, excludeReservationId = null) => {
  const newStart = new Date(startDateTime);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

  const query = {
    tableId,
    status: { $ne: 'CANCELLED' },
    dateTime: { $lt: newEnd },
    endTime: { $gt: newStart }
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const conflictingReservation = await Reservation.findOne(query);
  return conflictingReservation;
};

/**
 * Validate allowed status transitions
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return true;
  }

  const allowedTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['COMPLETED', 'CANCELLED'],
    CANCELLED: [],
    COMPLETED: []
  };

  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition: Cannot change status from '${currentStatus}' to '${newStatus}'.`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  return true;
};

/**
 * Cancel reservation with 2-hour academic cancellation policy
 * Customers can only cancel if reservation starts at least 2 hours from now.
 * Managers and Admins can perform administrative cancellations at any time.
 */
const cancelReservationWithPolicy = async (reservation, user, remarks = '') => {
  // Check if already cancelled or completed
  if (reservation.status === 'CANCELLED') {
    throw new AppError('Reservation is already cancelled', 409, 'RESERVATION_ALREADY_CANCELLED');
  }

  if (reservation.status === 'COMPLETED') {
    throw new AppError('Completed reservations cannot be cancelled', 409, 'RESERVATION_ALREADY_COMPLETED');
  }

  // Ownership verification
  if (
    user.role === 'customer' &&
    reservation.customerId.toString() !== user._id.toString()
  ) {
    throw new AppError(
      'You do not have permission to cancel this reservation',
      403,
      'FORBIDDEN'
    );
  }

  // Enforce 2-hour cancellation window for customers
  if (user.role === 'customer') {
    const reservationTime = new Date(reservation.dateTime).getTime();
    const currentTime = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (reservationTime - currentTime < twoHoursMs) {
      throw new AppError(
        'Reservation cannot be cancelled within 2 hours of the reservation time',
        409,
        'CANCELLATION_WINDOW_EXPIRED'
      );
    }
  }

  validateStatusTransition(reservation.status, 'CANCELLED');
  reservation.status = 'CANCELLED';
  reservation.statusHistory.push({
    status: 'CANCELLED',
    changedBy: user._id,
    changedAt: new Date(),
    remarks: remarks || `Reservation cancelled by ${user.role}`
  });

  await reservation.save();
  return reservation;
};

/**
 * Reschedule reservation atomically.
 * Checks conflict on new slot FIRST without modifying original reservation.
 */
const rescheduleReservationAtomic = async (reservation, newDateTime, newDuration, user, remarks = '') => {
  // Ownership verification
  if (
    user.role === 'customer' &&
    reservation.customerId.toString() !== user._id.toString()
  ) {
    throw new AppError(
      'You do not have permission to modify this reservation',
      403,
      'FORBIDDEN'
    );
  }

  if (['CANCELLED', 'COMPLETED'].includes(reservation.status)) {
    throw new AppError(
      `Cannot reschedule a ${reservation.status.toLowerCase()} reservation`,
      400,
      'BAD_REQUEST'
    );
  }

  const newStart = new Date(newDateTime);
  const duration = newDuration ? parseInt(newDuration, 10) : reservation.duration;

  // Conflict check on the new time slot (excluding current reservation)
  const conflict = await checkConflict(
    reservation.tableId,
    newStart,
    duration,
    reservation._id
  );

  if (conflict) {
    throw new AppError(
      'The selected new time slot is unavailable',
      409,
      'RESERVATION_CONFLICT'
    );
  }

  // Update only after conflict check succeeds
  reservation.dateTime = newStart;
  reservation.duration = duration;
  reservation.endTime = new Date(newStart.getTime() + duration * 60000);
  reservation.statusHistory.push({
    status: reservation.status,
    changedBy: user._id,
    changedAt: new Date(),
    remarks: remarks || `Rescheduled to ${newStart.toISOString()}`
  });

  await reservation.save();
  return reservation;
};

module.exports = {
  validateTableAndBranch,
  checkConflict,
  validateStatusTransition,
  cancelReservationWithPolicy,
  rescheduleReservationAtomic
};
