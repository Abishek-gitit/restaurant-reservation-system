const express = require('express');
const kitchenController = require('../controllers/kitchenController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get(
  '/orders',
  auth,
  authorize('kitchen', 'manager', 'admin'),
  kitchenController.getKitchenQueue
);

module.exports = router;
