import mongoose, { type Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import { getCartBillableAmountCents, getCartBillableTotal } from '../lib/pricing.js';
import { Cart } from '../models/Cart.js';
import { CheckoutSessionSnapshot } from '../models/CheckoutSessionSnapshot.js';
import { Order } from '../models/Order.js';
import type { ProductDocument } from '../models/Product.js';
import type { Env } from '../config/env.js';
import { decrementStockForLines } from '../services/inventory.service.js';
import { ApiError } from '../utils/ApiError.js';
import { isDuplicateKeyError } from '../utils/mongoErrors.js';

export function buildPaymentController(env: Env) {
  const stripe = env.STRIPE_SECRET_KEY
    ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
    : null;

  const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    if (!stripe) {
      return next(new ApiError('Stripe is not configured', 500));
    }
    const cart = await Cart.findOne({ user: req.user!._id }).populate({
      path: 'cartItems.product',
      select: 'title price imageCover',
    });
    if (!cart || cart.cartItems.length === 0) {
      return next(new ApiError('Cart is empty', 400));
    }
    const { shippingAddress } = req.body as { shippingAddress: Record<string, string> };
    if (!shippingAddress) {
      return next(new ApiError('Shipping address is required', 400));
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.BASE_URL}/cart`,
      customer_email: req.user!.email,
      client_reference_id: req.user!._id.toString(),
      line_items: cart.cartItems.map((item) => {
        const product = item.product as unknown as ProductDocument & { title: string; price: number; imageCover?: string };
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              images: product.imageCover ? [product.imageCover] : [],
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: item.quantity,
        };
      }),
      metadata: {
        userId: req.user!._id.toString(),
        shippingAddress: JSON.stringify(shippingAddress),
      },
    });

    await CheckoutSessionSnapshot.create({
      stripeSessionId: session.id,
      user: req.user!._id,
      lines: cart.cartItems.map((item) => {
        const product = item.product as unknown as ProductDocument;
        return {
          product: product._id,
          quantity: item.quantity,
          price: item.price ?? product.price,
        };
      }),
    });

    res.status(200).json({ status: 'success', session });
  };

  const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      return next(new ApiError('Stripe webhook is not configured', 500));
    }
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig ?? '', env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const sessionObj = event.data.object as Stripe.Checkout.Session;
      try {
        await createOrderFromSession(sessionObj);
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          res.status(200).json({ received: true });
          return;
        }
        throw err;
      }
    }

    res.status(200).json({ received: true });
  };

  async function createOrderFromSession(sessionObj: Stripe.Checkout.Session): Promise<void> {
    const existing = await Order.findOne({ stripeSessionId: sessionObj.id });
    if (existing) return;

    const userId = sessionObj.metadata?.userId;
    if (!userId) return;
    const shippingAddress = JSON.parse(sessionObj.metadata?.shippingAddress ?? '{}') as Record<string, string>;

    const snapshot = await CheckoutSessionSnapshot.findOne({ stripeSessionId: sessionObj.id });
    const snapshotOk =
      snapshot != null &&
      snapshot.user.toString() === userId &&
      Array.isArray(snapshot.lines) &&
      snapshot.lines.length > 0;

    let lines: Array<{ productId: Types.ObjectId; quantity: number }>;
    let cartItemsPayload: Array<{ product: Types.ObjectId; quantity: number; price: number }>;
    let totalOrderPrice: number;

    if (snapshotOk && snapshot) {
      lines = snapshot.lines.map((l) => ({
        productId: l.product as Types.ObjectId,
        quantity: l.quantity,
      }));
      cartItemsPayload = snapshot.lines.map((l) => ({
        product: l.product as Types.ObjectId,
        quantity: l.quantity,
        price: l.price,
      }));
      totalOrderPrice =
        sessionObj.amount_total != null
          ? sessionObj.amount_total / 100
          : snapshot.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    } else {
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'cartItems.product',
        select: 'title price quantity',
      });
      if (!cart || cart.cartItems.length === 0) return;

      lines = cart.cartItems.map((item) => {
        const product = item.product as unknown as ProductDocument;
        return { productId: product._id, quantity: item.quantity };
      });
      cartItemsPayload = cart.cartItems.map((item) => {
        const product = item.product as unknown as ProductDocument;
        return {
          product: product._id,
          quantity: item.quantity,
          price: item.price ?? product.price,
        };
      });
      totalOrderPrice =
        sessionObj.amount_total != null ? sessionObj.amount_total / 100 : getCartBillableTotal(cart);
    }

    const orderPayload = {
      user: userId,
      cartItems: cartItemsPayload,
      shippingAddress,
      totalOrderPrice,
      paymentMethod: 'stripe' as const,
      paymentStatus: 'paid' as const,
      status: 'processing' as const,
      stripeSessionId: sessionObj.id,
    };

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.startTransaction();
      await decrementStockForLines(dbSession, lines);
      await Order.create([orderPayload], { session: dbSession });
      await Cart.deleteOne({ user: userId }, { session: dbSession });
      if (snapshotOk) {
        await CheckoutSessionSnapshot.deleteOne({ stripeSessionId: sessionObj.id }, { session: dbSession });
      }
      await dbSession.commitTransaction();
    } catch (err) {
      await dbSession.abortTransaction();
      if (isDuplicateKeyError(err)) return;
      throw err;
    } finally {
      await dbSession.endSession();
    }
  }

  const getCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    if (!stripe) {
      return next(new ApiError('Stripe is not configured', 500));
    }
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return next(new ApiError('Session not found', 404));
    }
    res.status(200).json({ status: 'success', data: session });
  };

  const processPayment = async (req: Request, res: Response, next: NextFunction) => {
    if (!stripe) {
      return next(new ApiError('Stripe is not configured', 500));
    }
    const { paymentMethodId, shippingAddress } = req.body as {
      paymentMethodId: string;
      shippingAddress: Record<string, string>;
    };

    const cart = await Cart.findOne({ user: req.user!._id }).populate({
      path: 'cartItems.product',
      select: 'title price',
    });
    if (!cart || cart.cartItems.length === 0) {
      return next(new ApiError('Cart is empty', 400));
    }

    const totalAmount = getCartBillableAmountCents(cart);
    const totalOrderPrice = getCartBillableTotal(cart);

    try {
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
          userId: req.user!._id.toString(),
        },
      });

      if (paymentIntent.status !== 'succeeded') {
        return next(new ApiError('Payment failed', 400));
      }

      const lines = cart.cartItems.map((item) => {
        const product = item.product as unknown as ProductDocument;
        return { productId: product._id, quantity: item.quantity };
      });

      const orderPayload = {
        user: req.user!._id,
        cartItems: cart.cartItems.map((item) => {
          const product = item.product as unknown as ProductDocument;
          return {
            product: product._id,
            quantity: item.quantity,
            price: item.price ?? product.price,
          };
        }),
        shippingAddress,
        totalOrderPrice,
        paymentMethod: 'stripe' as const,
        paymentStatus: 'paid' as const,
        status: 'processing' as const,
        stripePaymentIntentId: paymentIntent.id,
      };

      const session = await mongoose.startSession();
      try {
        await session.startTransaction();
        await decrementStockForLines(session, lines);
        const [order] = await Order.create([orderPayload], { session });
        await Cart.deleteOne({ user: req.user!._id }, { session });
        await session.commitTransaction();
        res.status(200).json({ status: 'success', message: 'Payment successful', order });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment error';
      return next(new ApiError(message, 400));
    }
  };

  return {
    createCheckoutSession,
    handleStripeWebhook,
    getCheckoutSession,
    processPayment,
  };
}
