const {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deletehandler,
} = require('./handlers');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Coupon = require('../models/couponModel');

// @desc    Get list of coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin-Manager
const getCoupons = getAllHandler(Coupon);

// @desc    Get specific coupon by id
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin-Manager
const getCoupon = getByIdHandler(Coupon);

// @desc    Create coupon
// @route   POST  /api/v1/coupons
// @access  Private/Admin-Manager
const createCoupon = createHandler(Coupon);

// @desc    Update specific coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin-Manager
const updateCoupon = updateHandler(Coupon);

// @desc    Delete specific coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin-Manager
const deleteCoupon = deletehandler(Coupon);

// @desc    Validate coupon (public endpoint)
// @route   POST /api/v1/coupons/validate
// @access  Public
const validateCoupon = asyncHandler(async (req, res, next) => {
  const { couponName } = req.body;

  if (!couponName) {
    return next(new ApiError('Coupon name is required', 400));
  }

  // Find coupon by name and check if it's not expired
  const coupon = await Coupon.findOne({
    name: couponName.toUpperCase(),
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError('Invalid or expired coupon', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      name: coupon.name,
      discount: coupon.discount,
      expire: coupon.expire,
    },
  });
});

module.exports = {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
