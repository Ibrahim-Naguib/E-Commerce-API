const express = require('express');

const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
} = require('../controllers/categoryController');
const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require('../utils/validators/categoryValidator');
const { protect, allowedTo } = require('../controllers/authController');
const subcategoriesRoute = require('./subCategoryRoute');

router.use('/:categoryId/subcategories', subcategoriesRoute);

router
  .route('/')
  .get(getCategories)
  .post(
    protect,
    allowedTo('admin', 'manager'),
    uploadCategoryImage,
    resizeImage,
    createCategoryValidator,
    createCategory
  );
router
  .route('/:id')
  .get(getCategoryValidator, getCategory)
  .put(
    protect,
    allowedTo('admin', 'manager'),
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory
  )
  .delete(protect, allowedTo('admin'), deleteCategoryValidator, deleteCategory);

module.exports = router;
