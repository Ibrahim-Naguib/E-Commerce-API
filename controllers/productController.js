const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const Product = require('../models/productModel');
const {
  updateHandler,
  deletehandler,
  createHandler,
  getByIdHandler,
  getAllHandler,
} = require('./handlers');

const uploadProductImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

const resizeProductImages = asyncHandler(async (req, res, next) => {
  // console.log(req.files);
  //1- Image processing for imageCover
  if (req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/products/${imageCoverFileName}`);

    // Save image into our db
    req.body.imageCover = imageCoverFileName;
  }
  //2- Image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);

        // Save image into our db
        req.body.images.push(imageName);
      })
    );
  }
  next();
});

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
  uploadProductImages,
  resizeProductImages,
};
