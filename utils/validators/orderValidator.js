const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

const createOrderValidator = [
  check('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isLength({ min: 10 })
    .withMessage('Shipping address must be at least 10 characters'),

  check('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'paypal'])
    .withMessage('Payment method must be cash, card, or paypal'),

  check('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone(['ar-EG', 'ar-SA'])
    .withMessage('Invalid phone number'),

  validatorMiddleware,
];

const getOrderValidator = [
  check('id').isMongoId().withMessage('Invalid order id format'),
  validatorMiddleware,
];

const updateOrderValidator = [
  check('id').isMongoId().withMessage('Invalid order id format'),

  check('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'canceled'])
    .withMessage('Invalid order status'),

  check('isPaid')
    .optional()
    .isBoolean()
    .withMessage('isPaid must be a boolean'),

  validatorMiddleware,
];

module.exports = {
  createOrderValidator,
  getOrderValidator,
  updateOrderValidator,
};
