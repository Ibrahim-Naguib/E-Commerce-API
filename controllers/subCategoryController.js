const SubCategory = require('../models/subCategoryModel');
const {
  deletehandler,
  updateHandler,
  createHandler,
  getByIdHandler,
  getAllHandler,
} = require('./handlers');

// @desc    Nested route
// @route   GET /api/v1/categories/:categoryId/subcategories
// @access  Public
const createFilterObject = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) {
    filterObject = { category: req.params.categoryId };
  }
  req.filterObject = filterObject;
  next();
};

// @desc    Nested route
// @route   POST /api/v1/categories/:categoryId/subcategories
// @access  Private
const setCategoryIdToBody = (req, res, next) => {
  if (!req.body.category) {
    req.body.category = req.params.categoryId;
  }
  next();
};

// @desc    Get all subcategories
// @route   GET /api/v1/subcategories
// @access  Public
const getSubCategories = getAllHandler(SubCategory);

// @desc    Create a new sub category
// @route   POST /api/v1/subcategories
// @access  Private
const createSubCategory = createHandler(SubCategory);

// @desc    Get a single subcategory by id
// @route   GET /api/v1/subcategories/:id
// @access  Public
const getSubCategory = getByIdHandler(SubCategory);

// @desc    Update a subcategory by id
// @route   PUT /api/v1/subcategories/:id
// @access  Private
const updateSubCategory = updateHandler(SubCategory);

// @desc    Delete a subcategory by id
// @route   DELETE /api/v1/subcategories/:id
// @access  Private
const deleteSubCategory = deletehandler(SubCategory);

module.exports = {
  getSubCategories,
  createSubCategory,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdToBody,
  createFilterObject,
};
