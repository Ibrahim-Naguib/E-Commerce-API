const Brand = require('../models/brandModel');
const {
  deletehandler,
  updateHandler,
  createHandler,
  getByIdHandler,
  getAllHandler,
} = require('./handlers');

// @desc    Get all brands
// @route   GET /api/v1/brands
// @access  Public
const getBrands = getAllHandler(Brand);

// @desc    Get a single brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
const getBrand = getByIdHandler(Brand);

// @desc    Create a new brand
// @route   POST /api/v1/brands
// @access  Private
const createBrand = createHandler(Brand);

// @desc    Update a brand by id
// @route   PUT /api/v1/brands/:id
// @access  Private
const updateBrand = updateHandler(Brand);

// @desc    Delete a brand by id
// @route   DELETE /api/v1/brands/:id
// @access  Private
const deleteBrand = deletehandler(Brand);

module.exports = {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
