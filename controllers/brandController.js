const Brand = require('../models/brandModel');
const sharp = require('sharp');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const {
  deletehandler,
  updateHandler,
  createHandler,
  getByIdHandler,
  getAllHandler,
} = require('./handlers');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');

const uploadBrandImage = uploadSingleImage('image');

// Image processing
const resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 95 })
    .toFile(`uploads/brands/${filename}`);

  // Save image into our db
  req.body.image = filename;

  next();
});

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
  uploadBrandImage,
  resizeImage,
};
