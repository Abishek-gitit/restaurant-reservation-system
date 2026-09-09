const express = require('express');
const reservationController = require('../controllers/reservationController');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const {
  customerOrdersQuerySchema,
  customerReservationsQuerySchema
} = require('../validators/customerValidator');

const router = express.Router();

// Self customer routes (/api/customers/orders, /api/customers/reservations)
router.get(
  '/orders',
  auth,
  validate(customerOrdersQuerySchema, 'query'),
  orderController.getCustomerOrders
);

router.get(
  '/reservations',
  auth,
  validate(customerReservationsQuerySchema, 'query'),
  reservationController.getCustomerReservations
);

// Parameterized routes (/api/customers/:id/reservations, /api/customers/:id/orders)
router.get(
  '/:id/reservations',
  auth,
  validate(idParamSchema, 'params'),
  validate(customerReservationsQuerySchema, 'query'),
  reservationController.getCustomerReservations
);

router.get(
  '/:id/orders',
  auth,
  validate(idParamSchema, 'params'),
  validate(customerOrdersQuerySchema, 'query'),
  orderController.getCustomerOrders
);

module.exports = router;
