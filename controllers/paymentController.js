const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ApiError = require('../utils/apiError');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

// @desc Create Stripe checkout session
// @route POST /api/v1/payments/checkout-session
// @access Private/User
const createCheckoutSession = asyncHandler(async (req, res, next) => {
  // 1) Get cart for the current user
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'cartItems.product',
    select: 'title price imageCover',
  });

  if (!cart || cart.cartItems.length === 0) {
    return next(new ApiError('Cart is empty', 400));
  }

  // 2) Get shipping address from request body
  const { shippingAddress } = req.body;

  if (!shippingAddress) {
    return next(new ApiError('Shipping address is required', 400));
  }

  // 3) Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/cart`,
    customer_email: req.user.email,
    client_reference_id: req.user._id.toString(),
    line_items: cart.cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.title,
          images: item.product.imageCover
            ? [
                `${process.env.BASE_URL}/uploads/products/${item.product.imageCover}`,
              ]
            : [],
        },
        unit_amount: item.product.price * 100, // Convert to cents
      },
      quantity: item.quantity,
    })),
    metadata: {
      userId: req.user._id.toString(),
      shippingAddress: JSON.stringify(shippingAddress),
    },
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

// @desc Handle Stripe webhook for successful payments
// @route POST /api/v1/payments/webhook
// @access Public (Stripe only)
const handleStripeWebhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await createOrderFromSession(session);
  }

  res.status(200).json({ received: true });
});

// Helper function to create order from successful Stripe session
const createOrderFromSession = async (session) => {
  const userId = session.metadata.userId;
  const shippingAddress = JSON.parse(session.metadata.shippingAddress);

  // Get user cart
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'cartItems.product',
    select: 'title price',
  });

  if (!cart) return;

  // Create order
  const order = await Order.create({
    user: userId,
    cartItems: cart.cartItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    })),
    shippingAddress,
    totalOrderPrice: session.amount_total / 100, // Convert from cents
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    status: 'processing',
    stripeSessionId: session.id,
  });

  // Clear user cart after successful order
  await Cart.findOneAndDelete({ user: userId });

  console.log('Order created successfully:', order._id);
};

// @desc Get checkout session details
// @route GET /api/v1/payments/session/:sessionId
// @access Private/User
const getCheckoutSession = asyncHandler(async (req, res, next) => {
  const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

  if (!session) {
    return next(new ApiError('Session not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: session,
  });
});

// @desc Process payment with card (for direct payments)
// @route POST /api/v1/payments/process
// @access Private/User
const processPayment = asyncHandler(async (req, res, next) => {
  const { paymentMethodId, shippingAddress } = req.body;

  // Get cart for the current user
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'cartItems.product',
    select: 'title price',
  });

  if (!cart || cart.cartItems.length === 0) {
    return next(new ApiError('Cart is empty', 400));
  }

  const totalAmount = cart.totalCartPrice * 100; // Convert to cents

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    if (paymentIntent.status === 'succeeded') {
      // Create order
      const order = await Order.create({
        user: req.user._id,
        cartItems: cart.cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        shippingAddress,
        totalOrderPrice: cart.totalCartPrice,
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        status: 'processing',
        stripePaymentIntentId: paymentIntent.id,
      });

      // Clear user cart
      await Cart.findOneAndDelete({ user: req.user._id });

      res.status(200).json({
        status: 'success',
        message: 'Payment successful',
        order,
      });
    } else {
      return next(new ApiError('Payment failed', 400));
    }
  } catch (error) {
    console.error('Payment error:', error);
    return next(new ApiError(error.message, 400));
  }
});

module.exports = {
  createCheckoutSession,
  handleStripeWebhook,
  getCheckoutSession,
  processPayment,
};
