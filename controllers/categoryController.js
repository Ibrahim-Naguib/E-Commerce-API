const Category = require('../models/categoryModel');
const {
  deletehandler,
  updateHandler,
  createHandler,
  getByIdHandler,
  getAllHandler,
} = require('./handlers');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
const getCategories = getAllHandler(Category);

// @desc    Get a single category by id
// @route   GET /api/v1/categories/:id
// @access  Public
const getCategory = getByIdHandler(Category);

// @desc    Create a new category
// @route   POST /api/v1/categories
// @access  Private
const createCategory = createHandler(Category);

// @desc    Update a category by id
// @route   PUT /api/v1/categories/:id
// @access  Private
const updateCategory = updateHandler(Category);

// @desc    Delete a category by id
// @route   DELETE /api/v1/categories/:id
// @access  Private
const deleteCategory = deletehandler(Category);

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
