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

// API Root Overview
router.get('/', (req, res) => {
  return successResponse(res, 200, 'RestoHub REST API Root', {
    system: 'Restaurant Table Reservation & Food Ordering System',
    version: '1.0.0 (CIA-3 Submission)',
    webPortal: 'http://localhost:5001/',
    health: '/api/health',
    modules: {
      auth: '/api/auth',
      branches: '/api/branches',
      menu: '/api/menu',
      tables: '/api/tables',
      reservations: '/api/reservations',
      orders: '/api/orders',
      kitchen: '/api/kitchen',
      customers: '/api/customers',
      feedback: '/api/feedback',
      reports: '/api/manager/reports'
    }
  });
});

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
