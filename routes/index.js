const express = require('express');
const authRoutes = require('./authRoutes');
const branchRoutes = require('./branchRoutes');
const menuRoutes = require('./menuRoutes');
const tableRoutes = require('./tableRoutes');
const reservationRoutes = require('./reservationRoutes');
const orderRoutes = require('./orderRoutes');
const customerRoutes = require('./customerRoutes');
const kitchenRoutes = require('./kitchenRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const reportRoutes = require('./reportRoutes');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

// Health Check API
router.get('/health', (req, res) => {
  return successResponse(res, 200, 'Restaurant API is running', {
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tableRoutes);
router.use('/reservations', reservationRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/manager/reports', reportRoutes);

module.exports = router;
