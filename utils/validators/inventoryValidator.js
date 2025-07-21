const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

const updateProductStockValidator = [
  check('quantity')
    .isNumeric()
    .withMessage('Quantity must be a number')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a non-negative number'),

  check('operation')
    .optional()
    .isIn(['set', 'add', 'subtract'])
    .withMessage('Operation must be either "set", "add", or "subtract"'),

  validatorMiddleware,
];

const bulkUpdateStockValidator = [
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates must be an array with at least one item'),

  body('updates.*.productId')
    .notEmpty()
    .withMessage('Each update must have a productId')
    .isMongoId()
    .withMessage('ProductId must be a valid MongoDB ObjectId'),

  body('updates.*.quantity')
    .isNumeric()
    .withMessage('Quantity must be a number')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a non-negative number'),

  body('updates.*.operation')
    .optional()
    .isIn(['set', 'add', 'subtract'])
    .withMessage('Operation must be either "set", "add", or "subtract"'),

  validatorMiddleware,
];

module.exports = {
  updateProductStockValidator,
  bulkUpdateStockValidator,
};
