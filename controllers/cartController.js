const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const Cart = require('../models/cartModel');

const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });
  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return totalPrice;
};

// @desc    Add product to  cart
// @route   POST /api/v1/cart
// @access  Private/User
const addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color } = req.body;
  const product = await Product.findById(productId);

  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Check if product is in stock
  if (product.quantity <= 0) {
    return next(new ApiError('Product is out of stock', 400));
  }

  // 1) Get Cart for logged user
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    // Check stock availability for new cart
    if (product.quantity < 1) {
      return next(new ApiError('Insufficient stock available', 400));
    }

    // create cart fot logged user with product
    cart = await Cart.create({
      user: req.user._id,
      cartItems: [{ product: productId, color, price: product.price }],
    });
  } else {
    // product exist in cart, update product quantity
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color
    );

    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];
      const newQuantity = cartItem.quantity + 1;

      // Check if enough stock is available
      if (product.quantity < newQuantity) {
        return next(
          new ApiError(`Only ${product.quantity} items available in stock`, 400)
        );
      }

      cartItem.quantity = newQuantity;
      cart.cartItems[productIndex] = cartItem;
    } else {
      // Check stock availability for new item
      if (product.quantity < 1) {
        return next(new ApiError('Insufficient stock available', 400));
      }

      // product not exist in cart,  push product to cartItems array
      cart.cartItems.push({ product: productId, color, price: product.price });
    }
  }

  // Calculate total cart price
  calcTotalCartPrice(cart);
  await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Product added to cart successfully',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Get logged user cart
// @route   GET /api/v1/cart
// @access  Private/User
const getLoggedUserCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user id: ${req.user._id}`, 404)
    );
  }

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Remove specific cart item
// @route   DELETE /api/v1/cart/:itemId
// @access  Private/User
const removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate({ user: req.user._id });
  //   {
  //     $pull: { cartItems: { _id: req.params.itemId } },
  //   },
  //   { new: true }
  // );

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );
  if (itemIndex === -1) {
    return next(
      new ApiError(`No cart item found with id: ${req.params.itemId}`, 404)
    );
  }
  cart.cartItems.splice(itemIndex, 1);

  calcTotalCartPrice(cart);
  cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    clear logged user cart
// @route   DELETE /api/v1/cart
// @access  Private/User
const clearCart = asyncHandler(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.status(204).send();
});

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private/User
const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(`there is no cart for user ${req.user._id}`, 404));
  }

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );
  if (itemIndex > -1) {
    const cartItem = cart.cartItems[itemIndex];
    cartItem.quantity = quantity;
    cart.cartItems[itemIndex] = cartItem;
  } else {
    return next(
      new ApiError(`there is no item for this id :${req.params.itemId}`, 404)
    );
  }

  calcTotalCartPrice(cart);

  await cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Apply coupon on logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Private/User
const applyCoupon = asyncHandler(async (req, res, next) => {
  // 1) Get coupon based on coupon name
  const coupon = await Coupon.findOne({
    name: req.body.coupon,
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired`));
  }

  // 2) Get logged user cart to get total cart price
  const cart = await Cart.findOne({ user: req.user._id });

  const totalPrice = cart.totalCartPrice;

  // 3) Calculate price after priceAfterDiscount
  const totalPriceAfterDiscount = (
    totalPrice -
    (totalPrice * coupon.discount) / 100
  ).toFixed(2);

  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Sync local cart with backend cart (merge and return merged cart)
// @route   POST /api/v1/cart/sync
// @access  Private/User
const syncCart = asyncHandler(async (req, res, next) => {
  const { cartItems: localCartItems } = req.body;

  if (!localCartItems || !Array.isArray(localCartItems)) {
    return next(new ApiError('Cart items are required', 400));
  }

  // Get or create user's cart
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'cartItems.product',
    select: 'title price imageCover quantity',
  });

  if (!cart) {
    // Create new cart if none exists
    cart = await Cart.create({
      user: req.user._id,
      cartItems: [],
    });
  }

  // Merge logic: for each local cart item
  for (const localItem of localCartItems) {
    // Validate product exists
    const product = await Product.findById(localItem.product);
    if (!product) {
      console.warn(`Product ${localItem.product} not found, skipping`);
      continue;
    }

    // Check if item already exists in backend cart
    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === localItem.product
    );

    if (existingItemIndex > -1) {
      // Item exists, merge quantities (take the higher quantity)
      const existingItem = cart.cartItems[existingItemIndex];
      const mergedQuantity = Math.max(
        existingItem.quantity,
        localItem.quantity
      );

      // Check stock availability
      if (product.quantity >= mergedQuantity) {
        existingItem.quantity = mergedQuantity;
        existingItem.price = product.price; // Update to current price
      } else {
        // Use available stock
        existingItem.quantity = Math.min(mergedQuantity, product.quantity);
      }
    } else {
      // Item doesn't exist, add it
      const quantityToAdd = Math.min(localItem.quantity, product.quantity);

      if (quantityToAdd > 0) {
        cart.cartItems.push({
          product: localItem.product,
          quantity: quantityToAdd,
          price: product.price,
          color: localItem.color,
        });
      }
    }
  }

  // Calculate total and save
  calcTotalCartPrice(cart);
  await cart.save();

  // Populate the cart for response
  await cart.populate({
    path: 'cartItems.product',
    select: 'title price imageCover quantity',
  });

  res.status(200).json({
    status: 'success',
    message: 'Cart synced successfully',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

module.exports = {
  addProductToCart,
  getLoggedUserCart,
  removeSpecificCartItem,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
  syncCart,
};
