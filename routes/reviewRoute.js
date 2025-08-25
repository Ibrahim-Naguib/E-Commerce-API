const express = require('express');
const {
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
} = require('../controllers/reviewController');

const {
  createReviewValidator,
  getReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require('../utils/validators/reviewValidator');

const { protect, allowedTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', createFilterObject, getReviews);
router.get('/:id', getReviewValidator, getReview);

// Protected routes (require authentication)
router.use(protect);

// User routes
router.get('/user/myReviews', getMyReviews);
router.post(
  '/',
  allowedTo('user', 'admin'),
  setProductAndUserIds,
  checkExistingReview,
  createReviewValidator,
  createReview
);

// Routes for review owner or admin
router
  .route('/:id')
  .put(checkReviewOwnership, updateReviewValidator, updateReview)
  .delete(checkReviewOwnership, deleteReviewValidator, deleteReview);

module.exports = router;
