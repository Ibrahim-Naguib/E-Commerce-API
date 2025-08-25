const express = require('express');
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  updateOrder,
  cancelOrder,
  deleteOrder,
} = require('../controllers/orderController');

const {
  createOrderValidator,
  getOrderValidator,
  updateOrderValidator,
} = require('../utils/validators/orderValidator');

const { protect, allowedTo } = require('../controllers/authController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createOrderValidator, createOrder);
router.get('/myOrders', getMyOrders); // Get user's own orders

// Admin/Manager routes for all orders
router.get('/', allowedTo('admin', 'manager'), getAllOrders);

// Routes accessible by order owner or admin/manager
router
  .route('/:id')
  .get(getOrderValidator, getOrder)
  .put(allowedTo('admin', 'manager'), updateOrderValidator, updateOrder)
  .delete(allowedTo('admin', 'manager'), getOrderValidator, deleteOrder);

// Cancel order route (accessible by order owner or admin)
router.put('/:id/cancel', getOrderValidator, cancelOrder);

module.exports = router;
