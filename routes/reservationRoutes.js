const express = require('express');
const reservationController = require('../controllers/reservationController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const {
  createReservationSchema,
  updateReservationSchema,
  getReservationsQuerySchema,
  cancelReservationSchema,
  rescheduleReservationSchema
} = require('../validators/reservationValidator');

const router = express.Router();

router
  .route('/')
  .post(
    auth,
    validate(createReservationSchema),
    reservationController.createReservation
  )
  .get(
    auth,
    validate(getReservationsQuerySchema, 'query'),
    reservationController.getReservations
  );

router
  .route('/:id/cancel')
  .put(
    auth,
    validate(idParamSchema, 'params'),
    validate(cancelReservationSchema),
    reservationController.cancelReservation
  )
  .patch(
    auth,
    validate(idParamSchema, 'params'),
    validate(cancelReservationSchema),
    reservationController.cancelReservation
  );

router
  .route('/:id/reschedule')
  .put(
    auth,
    validate(idParamSchema, 'params'),
    validate(rescheduleReservationSchema),
    reservationController.rescheduleReservation
  );

router
  .route('/:id')
  .get(
    auth,
    validate(idParamSchema, 'params'),
    reservationController.getReservationById
  )
  .put(
    auth,
    validate(idParamSchema, 'params'),
    validate(updateReservationSchema),
    reservationController.updateReservation
  )
  .delete(
    auth,
    validate(idParamSchema, 'params'),
    validate(cancelReservationSchema),
    reservationController.cancelReservation
  );

module.exports = router;
