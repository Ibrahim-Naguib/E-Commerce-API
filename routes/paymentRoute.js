const express = require('express');
const {
  createCheckoutSession,
  handleStripeWebhook,
  getCheckoutSession,
  processPayment,
} = require('../controllers/paymentController');
const authController = require('../controllers/authController');
const {
  createCheckoutSessionValidator,
  processPaymentValidator,
} = require('../utils/validators/paymentValidator');

const router = express.Router();

// Webhook route (must be before express.json() middleware)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Protected routes - require authentication
router.use(authController.protect);

// Restrict to users only
router.use(authController.allowedTo('user', 'admin'));

router.post(
  '/checkout-session',
  createCheckoutSessionValidator,
  createCheckoutSession
);
router.get('/session/:sessionId', getCheckoutSession);
router.post('/process', processPaymentValidator, processPayment);

module.exports = router;
