const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

const addToWishlistValidator = [
  check('productId')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  validatorMiddleware,
];

const removeFromWishlistValidator = [
  check('productId')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  validatorMiddleware,
];

const checkProductInWishlistValidator = [
  check('productId')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  validatorMiddleware,
];

module.exports = {
  addToWishlistValidator,
  removeFromWishlistValidator,
  checkProductInWishlistValidator,
};
