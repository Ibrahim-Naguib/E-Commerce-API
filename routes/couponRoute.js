const express = require('express');

const {
  getCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');

const { protect, allowedTo } = require('../controllers/authController');
const {
  couponValidationLimiter,
} = require('../middlewares/rateLimitMiddleware');
const {
  createCouponValidator,
  updateCouponValidator,
  validateCouponValidator,
} = require('../utils/validators/couponValidator');

const router = express.Router();

// Public route for coupon validation with rate limiting and validation
router.post(
  '/validate',
  couponValidationLimiter,
  validateCouponValidator,
  validateCoupon
);

// Protected routes for coupon management
router.use(protect, allowedTo('admin', 'manager'));

router.route('/').get(getCoupons).post(createCouponValidator, createCoupon);
router
  .route('/:id')
  .get(getCoupon)
  .put(updateCouponValidator, updateCoupon)
  .delete(deleteCoupon);

module.exports = router;
