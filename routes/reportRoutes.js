const express = require('express');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { reportQuerySchema } = require('../validators/reportValidator');

const router = express.Router();

// Apply manager and admin authorization across all report routes
router.use(auth, authorize('manager', 'admin'), validate(reportQuerySchema, 'query'));

router.get('/summary', reportController.getSummary);
router.get('/sales', reportController.getSalesReport);
router.get('/popular-dishes', reportController.getPopularDishes);
router.get('/peak-hours', reportController.getPeakHours);
router.get('/reservation-peak-hours', reportController.getReservationPeakHours);
router.get('/ratings', reportController.getRatingsReport);

module.exports = router;
