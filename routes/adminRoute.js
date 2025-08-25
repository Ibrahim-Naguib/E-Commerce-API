const express = require('express');
const {
  getOverviewStats,
  getSalesStats,
  getTopProductsStats,
} = require('../controllers/adminController');

const { protect, allowedTo } = require('../controllers/authController');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(allowedTo('admin'));

// Simple admin stats endpoints
router.get('/stats/overview', getOverviewStats);
router.get('/stats/sales', getSalesStats);
router.get('/stats/top-products', getTopProductsStats);

module.exports = router;
