const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrdersQuerySchema
} = require('../validators/orderValidator');

const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

router
  .route('/')
  .post(auth, validate(createOrderSchema), orderController.createOrder)
  .get(auth, validate(getOrdersQuerySchema, 'query'), orderController.getOrders);

router
  .route('/:id')
  .get(auth, validate(idParamSchema, 'params'), orderController.getOrderById);

router
  .route('/:id/status')
  .put(
    auth,
    authorize('manager', 'kitchen', 'admin'),
    validate(idParamSchema, 'params'),
    validate(updateOrderStatusSchema),
    orderController.updateOrderStatus
  )
  .patch(
    auth,
    authorize('manager', 'kitchen', 'admin'),
    validate(idParamSchema, 'params'),
    validate(updateOrderStatusSchema),
    orderController.updateOrderStatus
  );

router
  .route('/:id/bill')
  .get(
    auth,
    authorize('customer', 'manager', 'admin'),
    validate(idParamSchema, 'params'),
    orderController.getOrderBill
  );

router
  .route('/:id/summary')
  .get(
    auth,
    authorize('customer', 'manager', 'admin'),
    validate(idParamSchema, 'params'),
    orderController.getOrderSummary
  );

router
  .route('/:id/feedback')
  .get(
    auth,
    validate(idParamSchema, 'params'),
    feedbackController.getOrderFeedback
  );

module.exports = router;
