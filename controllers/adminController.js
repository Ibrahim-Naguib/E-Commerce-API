const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

// @desc Get overview statistics
// @route GET /api/v1/admin/stats/overview
// @access Private/Admin
const getOverviewStats = asyncHandler(async (req, res, next) => {
  // Get basic counts
  const [totalUsers, totalOrders, totalProducts] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
  ]);

  // Get total revenue from paid/delivered orders
  const revenueData = await Order.aggregate([
    { $match: { status: { $in: ['paid', 'delivered'] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalOrderPrice' },
      },
    },
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  res.status(200).json({
    status: 'success',
    data: {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
    },
  });
});

// @desc Get sales statistics
// @route GET /api/v1/admin/stats/sales
// @access Private/Admin
const getSalesStats = asyncHandler(async (req, res, next) => {
  // Get last 6 months data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlySales = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'delivered'] },
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$totalOrderPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      monthlySales,
    },
  });
});

// @desc Get top products statistics
// @route GET /api/v1/admin/stats/top-products
// @access Private/Admin
const getTopProductsStats = asyncHandler(async (req, res, next) => {
  const topProducts = await Order.aggregate([
    { $unwind: '$cartItems' },
    {
      $group: {
        _id: '$cartItems.product',
        totalSold: { $sum: '$cartItems.quantity' },
        totalRevenue: {
          $sum: { $multiply: ['$cartItems.quantity', '$cartItems.price'] },
        },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        title: '$product.title',
        totalSold: 1,
        totalRevenue: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      topProducts,
    },
  });
});

module.exports = {
  getOverviewStats,
  getSalesStats,
  getTopProductsStats,
};
