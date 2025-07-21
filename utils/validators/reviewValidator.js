const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

const createReviewValidator = [
  check('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  check('title')
    .notEmpty()
    .withMessage('Review title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Review title must be between 3 and 100 characters'),

  check('comment')
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Review comment must be between 10 and 500 characters'),

  check('product')
    .notEmpty()
    .withMessage('Product is required')
    .isMongoId()
    .withMessage('Invalid product id format'),

  validatorMiddleware,
];

const getReviewValidator = [
  check('id').isMongoId().withMessage('Invalid review id format'),
  validatorMiddleware,
];

const updateReviewValidator = [
  check('id').isMongoId().withMessage('Invalid review id format'),

  check('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  check('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Review title must be between 3 and 100 characters'),

  check('comment')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Review comment must be between 10 and 500 characters'),

  validatorMiddleware,
];

const deleteReviewValidator = [
  check('id').isMongoId().withMessage('Invalid review id format'),
  validatorMiddleware,
];

module.exports = {
  createReviewValidator,
  getReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
};
