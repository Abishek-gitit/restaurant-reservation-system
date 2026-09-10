const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Protect all routes with auth + admin role check
router.use(auth, authorize('admin'));

router
  .route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

module.exports = router;
