const Category = require('../models/categoryModel');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const sharp = require('sharp');
const {
  deletehandler,
  updateHandler,
  createHandler,
  getByIdHandler,
  getAllHandler,
} = require('./handlers');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');

// Image processing
const resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/categories/${filename}`);

    // Save image into our db
    req.body.image = filename;
  }
  next();
});

const uploadCategoryImage = uploadSingleImage('image');

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
// @access  Private/Manager/Admin
const createCategory = createHandler(Category);

// @desc    Update a category by id
// @route   PUT /api/v1/categories/:id
// @access  Private/Manager/Admin
const updateCategory = updateHandler(Category);

// @desc    Delete a category by id
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
const deleteCategory = deletehandler(Category);

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
};
