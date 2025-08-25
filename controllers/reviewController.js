const {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deletehandler,
} = require('./handlers');
const Review = require('../models/reviewModel');
const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

// Set product and user IDs for nested routes
const setProductAndUserIds = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

// Create filter object for nested routes
const createFilterObject = (req, res, next) => {
  let filterObject = {};
  if (req.params.productId) filterObject = { product: req.params.productId };
  req.filterObj = filterObject;
  next();
};

// @desc Check if user already reviewed the product
// @access Private/User
const checkExistingReview = asyncHandler(async (req, res, next) => {
  const existingReview = await Review.findOne({
    user: req.user._id,
  });

  if (existingReview) {
    return next(new ApiError('You have already reviewed this product', 400));
  }
  next();
});

// @desc Check if user can modify this review
// @access Private/User
const checkReviewOwnership = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError('Review not found', 404));
  }

  // Allow if user is admin/manager or review owner
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    review.user.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError('Not authorized to modify this review', 403));
  }

  // Pass the review to the next middleware to avoid duplicate query
  req.reviewDoc = review;
  next();
});

// @desc Get all reviews
// @route GET /api/v1/reviews
// @route GET /api/v1/products/:productId/reviews
// @access Public
const getReviews = getAllHandler(Review);

// @desc Get specific review
// @route GET /api/v1/reviews/:id
// @access Public
const getReview = getByIdHandler(Review);

// @desc Create new review
// @route POST /api/v1/reviews
// @route POST /api/v1/products/:productId/reviews
// @access Private/User
const createReview = asyncHandler(async (req, res, next) => {
  // Check if product exists
  const product = await Product.findById(req.body.product);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Use the generic create handler
  return createHandler(Review)(req, res, next);
});

// @desc Update review
// @route PUT /api/v1/reviews/:id
// @access Private/User (own reviews) or Admin
const updateReview = asyncHandler(async (req, res, next) => {
  // Use the review document from checkReviewOwnership middleware
  const review = req.reviewDoc;

  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError('Please provide data to update the review', 400));
  }

  // Update the review fields
  Object.assign(review, req.body);

  // Save the updated review
  const updatedReview = await review.save();

  res.status(200).json({ data: updatedReview });
});

// @desc Delete review
// @route DELETE /api/v1/reviews/:id
// @access Private/User (own reviews) or Admin
const deleteReview = asyncHandler(async (req, res, next) => {
  // Use the review document from checkReviewOwnership middleware
  const review = req.reviewDoc;

  // Delete the review
  await review.deleteOne();

  res.status(204).send();
});

// @desc Get user's reviews
// @route GET /api/v1/reviews/myReviews
// @access Private/User
const getMyReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate({
      path: 'product',
      select: 'title imageCover',
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews,
  });
});

module.exports = {
  setProductAndUserIds,
  createFilterObject,
  checkExistingReview,
  checkReviewOwnership,
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
};
