const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

const createCouponValidator = [
  check('name')
    .notEmpty()
    .withMessage('Coupon name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Coupon name must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Coupon name must contain only uppercase letters and numbers')
    .custom((val, { req }) => {
      req.body.name = val.toUpperCase();
      return true;
    }),

  check('discount')
    .notEmpty()
    .withMessage('Discount is required')
    .isNumeric()
    .withMessage('Discount must be a number')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100 percent'),

  check('expire')
    .notEmpty()
    .withMessage('Expiration date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((val) => {
      const expireDate = new Date(val);
      const now = new Date();
      if (expireDate <= now) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),

  validatorMiddleware,
];

const updateCouponValidator = [
  check('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Coupon name must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Coupon name must contain only uppercase letters and numbers')
    .custom((val, { req }) => {
      if (val) req.body.name = val.toUpperCase();
      return true;
    }),

  check('discount')
    .optional()
    .isNumeric()
    .withMessage('Discount must be a number')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100 percent'),

  check('expire')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((val) => {
      if (val) {
        const expireDate = new Date(val);
        const now = new Date();
        if (expireDate <= now) {
          throw new Error('Expiration date must be in the future');
        }
      }
      return true;
    }),

  validatorMiddleware,
];

const validateCouponValidator = [
  check('couponName')
    .notEmpty()
    .withMessage('Coupon name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Coupon name must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      'Invalid coupon format. Use only uppercase letters and numbers'
    )
    .custom((val, { req }) => {
      req.body.couponName = val.toUpperCase();
      return true;
    }),

  validatorMiddleware,
];

module.exports = {
  createCouponValidator,
  updateCouponValidator,
  validateCouponValidator,
};
