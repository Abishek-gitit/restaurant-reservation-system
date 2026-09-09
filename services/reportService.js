const mongoose = require('mongoose');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Feedback = require('../models/Feedback');
const AppError = require('../utils/appError');
const { checkBranchPermission } = require('../middleware/authorizeBranchAccess');

/**
 * Helper to build branch matching criteria based on role and query
 */
const buildBranchMatch = (user, branchId) => {
  if (branchId) {
    checkBranchPermission(user, branchId);
    return { branchId: new mongoose.Types.ObjectId(branchId) };
  }

  if (user.role === 'manager') {
    const assigned = Array.isArray(user.managedBranchIds) ? user.managedBranchIds : [];
    if (assigned.length > 0) {
      return {
        branchId: {
          $in: assigned.map((id) => (id._id ? new mongoose.Types.ObjectId(id._id) : new mongoose.Types.ObjectId(id)))
        }
      };
    }
  }

  return {};
};

/**
 * Helper to build date range criteria
 */
const buildDateMatch = (from, to, dateField = 'createdAt') => {
  if (!from && !to) return {};

  const match = {};
  if (from) {
    const startDate = new Date(from);
    if (isNaN(startDate.getTime())) {
      throw new AppError('Invalid from date format', 400, 'INVALID_DATE_RANGE');
    }
    startDate.setUTCHours(0, 0, 0, 0);
    match.$gte = startDate;
  }

  if (to) {
    const endDate = new Date(to);
    if (isNaN(endDate.getTime())) {
      throw new AppError('Invalid to date format', 400, 'INVALID_DATE_RANGE');
    }
    endDate.setUTCHours(23, 59, 59, 999);
    match.$lte = endDate;
  }

  if (match.$gte && match.$lte && match.$gte > match.$lte) {
    throw new AppError('From date must be earlier than or equal to to date', 400, 'INVALID_DATE_RANGE');
  }

  return { [dateField]: match };
};

/**
 * 1. Sales / Revenue Report
 */
const getSalesReport = async (user, { branchId, from, to }) => {
  const branchMatch = buildBranchMatch(user, branchId);
  const dateMatch = buildDateMatch(from, to, 'createdAt');

  const baseFilter = {
    ...branchMatch,
    ...dateMatch
  };

  // Aggregation over all orders to summarize counts and realized revenue
  const [report] = await Order.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: {
            $cond: [{ $in: ['$status', ['SERVED', 'DELIVERED']] }, 1, 0]
          }
        },
        cancelledOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0]
          }
        },
        subtotal: {
          $sum: {
            $cond: [{ $in: ['$status', ['SERVED', 'DELIVERED']] }, '$subtotal', 0]
          }
        },
        tax: {
          $sum: {
            $cond: [{ $in: ['$status', ['SERVED', 'DELIVERED']] }, '$taxAmount', 0]
          }
        },
        serviceCharge: {
          $sum: {
            $cond: [{ $in: ['$status', ['SERVED', 'DELIVERED']] }, '$serviceCharge', 0]
          }
        },
        totalRevenue: {
          $sum: {
            $cond: [{ $in: ['$status', ['SERVED', 'DELIVERED']] }, '$totalAmount', 0]
          }
        }
      }
    }
  ]);

  if (!report) {
    return {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      subtotal: 0,
      tax: 0,
      serviceCharge: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }

  const completed = report.completedOrders || 0;
  const revenue = Math.round((report.totalRevenue || 0) * 100) / 100;
  const aov = completed > 0 ? Math.round((revenue / completed) * 100) / 100 : 0;

  return {
    totalOrders: report.totalOrders,
    completedOrders: completed,
    cancelledOrders: report.cancelledOrders,
    subtotal: Math.round(report.subtotal * 100) / 100,
    tax: Math.round(report.tax * 100) / 100,
    serviceCharge: Math.round(report.serviceCharge * 100) / 100,
    totalRevenue: revenue,
    averageOrderValue: aov
  };
};

/**
 * 2. Popular Dishes Report
 * Unwinds embedded order items and groups by menuItemId
 */
const getPopularDishesReport = async (user, { branchId, from, to, limit = 10 }) => {
  const branchMatch = buildBranchMatch(user, branchId);
  const dateMatch = buildDateMatch(from, to, 'createdAt');

  const matchFilter = {
    ...branchMatch,
    ...dateMatch,
    status: { $in: ['SERVED', 'DELIVERED'] } // Only completed orders count for food popularity
  };

  const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 50));

  const dishes = await Order.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItemId',
        name: { $first: '$items.name' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' }
      }
    },
    { $sort: { quantitySold: -1, revenue: -1 } },
    { $limit: parsedLimit },
    {
      $project: {
        _id: 0,
        menuItemId: '$_id',
        name: 1,
        quantitySold: 1,
        revenue: { $round: ['$revenue', 2] }
      }
    }
  ]);

  return dishes;
};

/**
 * 3. Peak Hours Report
 * Groups non-cancelled orders by hour of creation
 */
const getPeakHoursReport = async (user, { branchId, from, to }) => {
  const branchMatch = buildBranchMatch(user, branchId);
  const dateMatch = buildDateMatch(from, to, 'createdAt');

  const matchFilter = {
    ...branchMatch,
    ...dateMatch,
    status: { $ne: 'CANCELLED' }
  };

  const peakHours = await Order.aggregate([
    { $match: matchFilter },
    {
      $project: {
        hour: { $hour: { date: '$createdAt', timezone: '+05:30' } }
      }
    },
    {
      $group: {
        _id: '$hour',
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { orderCount: -1, _id: 1 } },
    {
      $project: {
        _id: 0,
        hour: '$_id',
        orderCount: 1
      }
    }
  ]);

  return peakHours;
};

/**
 * 4. Reservation Peak Hours Report
 * Groups non-cancelled reservations by scheduled hour
 */
const getReservationPeakHoursReport = async (user, { branchId, from, to }) => {
  const branchMatch = buildBranchMatch(user, branchId);
  const dateMatch = buildDateMatch(from, to, 'dateTime');

  const matchFilter = {
    ...branchMatch,
    ...dateMatch,
    status: { $ne: 'CANCELLED' }
  };

  const peakHours = await Reservation.aggregate([
    { $match: matchFilter },
    {
      $project: {
        hour: { $hour: { date: '$dateTime', timezone: '+05:30' } }
      }
    },
    {
      $group: {
        _id: '$hour',
        reservationCount: { $sum: 1 }
      }
    },
    { $sort: { reservationCount: -1, _id: 1 } },
    {
      $project: {
        _id: 0,
        hour: '$_id',
        reservationCount: 1
      }
    }
  ]);

  return peakHours;
};

/**
 * 5. Ratings / Feedback Analytics Report
 */
const getRatingsReport = async (user, { branchId, from, to }) => {
  const branchMatch = buildBranchMatch(user, branchId);
  const dateMatch = buildDateMatch(from, to, 'createdAt');

  const matchFilter = {
    ...branchMatch,
    ...dateMatch
  };

  const [result] = await Feedback.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratings: { $push: '$rating' }
      }
    }
  ]);

  if (!result) {
    return {
      averageRating: 0,
      totalReviews: 0,
      totalFeedbacks: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      distribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 0 },
        { rating: 3, count: 0 },
        { rating: 4, count: 0 },
        { rating: 5, count: 0 }
      ]
    };
  }

  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  for (const r of result.ratings) {
    const key = String(r);
    if (distribution[key] !== undefined) {
      distribution[key]++;
    }
  }

  return {
    averageRating: Math.round(result.averageRating * 10) / 10,
    totalReviews: result.totalReviews,
    totalFeedbacks: result.totalReviews,
    ratingDistribution: distribution,
    distribution: [
      { rating: 1, count: distribution['1'] },
      { rating: 2, count: distribution['2'] },
      { rating: 3, count: distribution['3'] },
      { rating: 4, count: distribution['4'] },
      { rating: 5, count: distribution['5'] }
    ]
  };
};

/**
 * 6. Executive Dashboard Summary
 */
const getDashboardSummary = async (user, query) => {
  const sales = await getSalesReport(user, query);
  const popularDishes = await getPopularDishesReport(user, { ...query, limit: 1 });
  const peakHours = await getPeakHoursReport(user, query);
  const ratings = await getRatingsReport(user, query);

  const branchMatch = buildBranchMatch(user, query.branchId);
  const dateMatch = buildDateMatch(query.from, query.to, 'dateTime');

  const totalReservations = await Reservation.countDocuments({
    ...branchMatch,
    ...dateMatch,
    status: { $ne: 'CANCELLED' }
  });

  return {
    totalRevenue: sales.totalRevenue,
    totalSales: sales.totalRevenue,
    totalOrders: sales.totalOrders,
    completedOrders: sales.completedOrders,
    cancelledOrders: sales.cancelledOrders,
    averageOrderValue: sales.averageOrderValue,
    totalReservations,
    averageRating: ratings.averageRating,
    popularDish: popularDishes.length > 0 ? popularDishes[0].name : null,
    peakHour: peakHours.length > 0 ? peakHours[0].hour : null
  };
};

module.exports = {
  getSalesReport,
  getPopularDishesReport,
  getPeakHoursReport,
  getReservationPeakHoursReport,
  getRatingsReport,
  getDashboardSummary
};
