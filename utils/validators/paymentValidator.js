const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

const createCheckoutSessionValidator = [
  check('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required'),

  check('shippingAddress.street')
    .notEmpty()
    .withMessage('Street address is required'),

  check('shippingAddress.city').notEmpty().withMessage('City is required'),

  check('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),

  check('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('ZIP code is required'),

  validatorMiddleware,
];

const processPaymentValidator = [
  check('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required'),

  check('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required'),

  check('shippingAddress.street')
    .notEmpty()
    .withMessage('Street address is required'),

  check('shippingAddress.city').notEmpty().withMessage('City is required'),

  check('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),

  check('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('ZIP code is required'),

  validatorMiddleware,
];

module.exports = {
  createCheckoutSessionValidator,
  processPaymentValidator,
};
