const { check, body } = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Category = require('../../models/categoryModel');
const SubCategory = require('../../models/subCategoryModel');

const getProductValidator = [
  check('id').isMongoId().withMessage('Invalid product id format'),
  validatorMiddleware,
];

const createProductValidator = [
  check('title')
    .isLength({ min: 3 })
    .withMessage('Product title must be at least 3 characters')
    .notEmpty()
    .withMessage('Product title is required')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Product description must be at least 10 characters'),
  check('quantity')
    .notEmpty()
    .withMessage('Product quantity is required')
    .isNumeric()
    .withMessage('Product quantity must be a number'),
  check('sold')
    .optional()
    .isNumeric()
    .withMessage('Product sold must be a number'),
  check('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isNumeric()
    .withMessage('Product price must be a number')
    .isLength({ max: 32 })
    .withMessage('Product price must be at most 32 characters'),
  check('priceAfterDiscount')
    .optional()
    .toFloat()
    .isNumeric()
    .withMessage('Product price after discount must be a number')
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error('Price after discount must be less than the price');
      }
      return true;
    }),
  check('colors')
    .optional()
    .isArray()
    .withMessage('Available colors must be an array of strings'),
  check('imageCover').notEmpty().withMessage('Product image cover is required'),
  check('images')
    .optional()
    .isArray()
    .withMessage('Product images must be an array of strings'),
  check('category')
    .notEmpty()
    .withMessage('Product category is required')
    .isMongoId()
    .withMessage('Invalid category id format')
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category found for this id ${categoryId}`)
          );
        }
      })
    ),
  check('subcategories')
    .optional()
    .isMongoId()
    .withMessage('Invalid subcategory id format')
    .custom((subcategoriesId) =>
      SubCategory.find({ _id: { $exists: true, $in: subcategoriesId } }).then(
        (subcategories) => {
          if (
            subcategories.length < 1 ||
            subcategories.length !== subcategoriesId.length
          ) {
            return Promise.reject(
              new Error(
                'Some subcategories do not exist or are not valid subcategory ids'
              )
            );
          }
        }
      )
    )
    .custom((val, { req }) =>
      SubCategory.find({ category: req.body.category }).then(
        (subcategories) => {
          const subcategoriesIdsInDB = [];
          subcategories.forEach((subcategory) =>
            subcategoriesIdsInDB.push(subcategory._id.toString())
          );
          const checker = (trarget, arr) =>
            trarget.every((v) => arr.includes(v));
          if (!checker(val, subcategoriesIdsInDB)) {
            return Promise.reject(
              new Error(
                'Some subcategories do not belong to the selected category'
              )
            );
          }
        }
      )
    ),
  check('brand').optional().isMongoId().withMessage('Invalid brand id format'),
  check('ratingsAverage')
    .optional()
    .isNumeric()
    .withMessage('Product ratings average must be a number')
    .isLength({ min: 1 })
    .withMessage('Product ratings average must be above or equal to 1.0')
    .isLength({ max: 5 })
    .withMessage('Product ratings average must be below or equal to 5.0'),
  check('ratingsQuantity')
    .optional()
    .isNumeric()
    .withMessage('Product ratings quantity must be a number'),

  validatorMiddleware,
];

const updateProductValidator = [
  check('id').isMongoId().withMessage('Invalid product id format'),
  body('title')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

const deleteProductValidator = [
  check('id').isMongoId().withMessage('Invalid product id format'),
  validatorMiddleware,
];

module.exports = {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
};
