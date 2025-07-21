const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');

// @desc Get user's wishlist
// @route GET /api/v1/wishlist
// @access Private/User
const getWishlist = asyncHandler(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    // Create empty wishlist if doesn't exist
    wishlist = await Wishlist.create({
      user: req.user._id,
      products: [],
    });
  }

  res.status(200).json({
    status: 'success',
    results: wishlist.products.length,
    data: wishlist,
  });
});

// @desc Add product to wishlist
// @route POST /api/v1/wishlist/:productId
// @access Private/User
const addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Find or create user's wishlist
  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    // Create new wishlist
    wishlist = await Wishlist.create({
      user: req.user._id,
      products: [productId],
    });
  } else {
    // Check if product is already in wishlist
    if (wishlist.products.includes(productId)) {
      return next(new ApiError('Product already in wishlist', 400));
    }

    // Add product to existing wishlist
    wishlist.products.push(productId);
    await wishlist.save();
  }

  // Populate the products before sending response
  await wishlist.populate({
    path: 'products',
    select: 'title price imageCover ratingsAverage',
  });

  res.status(200).json({
    status: 'success',
    message: 'Product added to wishlist successfully',
    data: wishlist,
  });
});

// @desc Remove product from wishlist
// @route DELETE /api/v1/wishlist/:productId
// @access Private/User
const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    return next(new ApiError('Wishlist not found', 404));
  }

  // Check if product is in wishlist
  if (!wishlist.products.includes(productId)) {
    return next(new ApiError('Product not found in wishlist', 404));
  }

  // Remove product from wishlist
  wishlist.products = wishlist.products.filter(
    (product) => product.toString() !== productId
  );

  await wishlist.save();

  res.status(200).json({
    status: 'success',
    message: 'Product removed from wishlist successfully',
    data: wishlist,
  });
});

// @desc Clear entire wishlist
// @route DELETE /api/v1/wishlist
// @access Private/User
const clearWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    return next(new ApiError('Wishlist not found', 404));
  }

  // Clear all products from wishlist
  wishlist.products = [];
  await wishlist.save();

  res.status(200).json({
    status: 'success',
    message: 'Wishlist cleared successfully',
    data: wishlist,
  });
});

// @desc Check if product is in user's wishlist
// @route GET /api/v1/wishlist/check/:productId
// @access Private/User
const checkProductInWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });

  const isInWishlist = wishlist ? wishlist.products.includes(productId) : false;

  res.status(200).json({
    status: 'success',
    data: {
      productId,
      isInWishlist,
    },
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkProductInWishlist,
};
