const {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deletehandler,
} = require('./handlers');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

// @desc Create a new order
// @route POST /api/v1/orders
// @access Private/User
const createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod } = req.body;
  const phone = req.body.phone || req.user.phone;

  // Get user's cart
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.cartItems.length === 0) {
    return next(new ApiError('Cart is empty', 400));
  }

  // Get total price from cart
  const totalOrderPrice = cart.totalPriceAfterDiscount || cart.totalCartPrice;

  // Create order
  const order = await Order.create({
    user: userId,
    cartItems: cart.cartItems,
    shippingAddress,
    phone,
    paymentMethod: paymentMethod || 'cash',
    totalOrderPrice,
  });

  // Clear user's cart after order creation
  await Cart.findOneAndDelete({ user: userId });

  res.status(201).json({
    status: 'success',
    message: 'Order created successfully',
    data: order,
  });
});

// @desc Get all orders
// @route GET /api/v1/orders
// @access Private/Admin
const getAllOrders = getAllHandler(Order);

// @desc Get user's orders
// @route GET /api/v1/orders/myOrders
// @access Private/User
const getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: orders,
  });
});

// @desc Get a single order by ID
// @route GET /api/v1/orders/:id
// @access Private/Admin or Order Owner
const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate({
      path: 'user',
      select: 'name email phone',
    })
    .populate({
      path: 'cartItems.product',
      select: 'title price imageCover',
    });

  if (!order) {
    return next(new ApiError('Order not found', 404));
  }

  // Allow access if user is admin/manager or order owner
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError('Not authorized to access this order', 403));
  }

  res.status(200).json({
    status: 'success',
    data: order,
  });
});

// @desc Update order status
// @route PUT /api/v1/orders/:id
// @access Private/Admin
const updateOrder = asyncHandler(async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError('Please provide data to update the order', 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError('Order not found', 404));
  }

  // Update order fields
  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      order[key] = req.body[key];
    }
  });

  // Set timestamp for delivery
  if (req.body.status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }

  if (req.body.isPaid === true && !order.paidAt) {
    order.paidAt = new Date();
  }

  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Order updated successfully',
    data: order,
  });
});

// @desc Cancel order
// @route PUT /api/v1/orders/:id/cancel
// @access Private/User (own orders) or Admin
const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError('Order not found', 404));
  }

  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError('Not authorized to cancel this order', 403));
  }

  // Check if order can be canceled
  if (order.status === 'delivered' || order.status === 'shipped') {
    return next(
      new ApiError(
        'Cannot cancel order that is already shipped or delivered',
        400
      )
    );
  }

  order.status = 'canceled';
  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Order canceled successfully',
    data: order,
  });
});

// @desc Delete an order
// @route DELETE /api/v1/orders/:id
// @access Private/Admin
const deleteOrder = deletehandler(Order);

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  updateOrder,
  cancelOrder,
  deleteOrder,
};
