const Product = require('../models/productModel');
const {
  updateHandler,
  deletehandler,
  createHandler,
  getByIdHandler,
  getAllHandler,
} = require('./handlers');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
const getProducts = getAllHandler(Product, 'Product');

// @desc    Get a single product by id
// @route   GET /api/v1/products/:id
// @access  Public
const getProduct = getByIdHandler(Product);

// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private
const createProduct = createHandler(Product);

// @desc    Update a product by id
// @route   PUT /api/v1/products/:id
// @access  Private
const updateProduct = updateHandler(Product);

// @desc    Delete a product by id
// @route   DELETE /api/v1/products/:id
// @access  Private
const deleteProduct = deletehandler(Product);

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
