const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkProductInWishlist,
} = require('../controllers/wishlistController');

const {
  addToWishlistValidator,
  removeFromWishlistValidator,
  checkProductInWishlistValidator,
} = require('../utils/validators/wishlistValidator');

const { protect, allowedTo } = require('../controllers/authController');

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(allowedTo('user', 'admin'));

// Wishlist routes
router.route('/').get(getWishlist).delete(clearWishlist);

router
  .route('/:productId')
  .post(addToWishlistValidator, addToWishlist)
  .delete(removeFromWishlistValidator, removeFromWishlist);

router.get(
  '/check/:productId',
  checkProductInWishlistValidator,
  checkProductInWishlist
);

module.exports = router;
