const express = require('express');
const { protect, allowedTo } = require('../controllers/authController');
const router = express.Router();

const {
  addProductToCart,
  getLoggedUserCart,
  removeSpecificCartItem,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
  syncCart,
} = require('../controllers/cartController');

router.use(protect, allowedTo('user', 'admin'));

router.post('/sync', syncCart);
router.put('/applyCoupon', applyCoupon);

router
  .route('/')
  .post(addProductToCart)
  .get(getLoggedUserCart)
  .delete(clearCart);

router
  .route('/:itemId')
  .put(updateCartItemQuantity)
  .delete(removeSpecificCartItem);

module.exports = router;
