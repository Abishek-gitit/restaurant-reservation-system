const express = require('express');
const kitchenController = require('../controllers/kitchenController');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const { updateOrderStatusSchema } = require('../validators/orderValidator');

const router = express.Router();

// Kitchen Queue (accessible via /api/kitchen/orders or /api/kitchen/queue)
router.get(
  ['/orders', '/queue'],
  auth,
  authorize('kitchen', 'manager', 'admin'),
  kitchenController.getKitchenQueue
);

// Kitchen order status advancement
router.patch(
  ['/orders/:id/status', '/:id/status'],
  auth,
  authorize('kitchen', 'manager', 'admin'),
  validate(idParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;
