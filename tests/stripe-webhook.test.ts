import request from 'supertest';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { Cart } from '../src/models/Cart.js';
import { Category } from '../src/models/Category.js';
import { CheckoutSessionSnapshot } from '../src/models/CheckoutSessionSnapshot.js';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';

describe('Stripe webhook', () => {
  it('accepts raw body and is idempotent for duplicate checkout.session.completed', async () => {
    const env = getEnv();
    const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

    const cat = await Category.create({ name: 'PayCat', slug: `paycat-${crypto.randomBytes(4).toString('hex')}` });
    const product = await Product.create({
      title: 'Pay title long enough',
      slug: `pay-item-${crypto.randomBytes(4).toString('hex')}`,
      description: 'Description long enough for validation rules here',
      quantity: 2,
      price: 5,
      imageCover: 'https://cdn.example.com/p.jpg',
      category: cat._id,
    });

    const user = await User.create({
      name: 'Payer',
      email: `pay_${crypto.randomBytes(4).toString('hex')}@t.com`,
      password: 'password123',
      role: 'user',
    });
    await Cart.create({
      user: user._id,
      cartItems: [{ product: product._id, quantity: 1, price: 5 }],
      totalCartPrice: 5,
    });

    const sessionId = `cs_test_${crypto.randomBytes(8).toString('hex')}`;
    const payload = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          amount_total: 500,
          metadata: {
            userId: user._id.toString(),
            shippingAddress: JSON.stringify({ street: '1', city: 'C', country: 'X', zipCode: '1' }),
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const header = stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    const app = createApp(env);

    const spy = vi.spyOn(Order, 'create');

    const first = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', header)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', header)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(second.status).toBe(200);

    const orders = await Order.find({ stripeSessionId: sessionId });
    expect(orders).toHaveLength(1);

    const createCalls = spy.mock.calls.filter((c) => Array.isArray(c[0]) && (c[0] as { stripeSessionId?: string }[])[0]?.stripeSessionId === sessionId);
    expect(createCalls.length).toBeLessThanOrEqual(1);
    spy.mockRestore();
  });

  it('fulfills paid checkout from CheckoutSessionSnapshot when cart is empty', async () => {
    const env = getEnv();
    const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

    const cat = await Category.create({ name: 'SnapCat', slug: `snap-${crypto.randomBytes(4).toString('hex')}` });
    const product = await Product.create({
      title: 'Snap title long enough',
      slug: `snap-p-${crypto.randomBytes(4).toString('hex')}`,
      description: 'Description long enough for validation rules here',
      quantity: 4,
      price: 5,
      imageCover: 'https://cdn.example.com/p.jpg',
      category: cat._id,
    });

    const user = await User.create({
      name: 'SnapUser',
      email: `snap_${crypto.randomBytes(4).toString('hex')}@t.com`,
      password: 'password123',
      role: 'user',
    });

    const sessionId = `cs_test_${crypto.randomBytes(8).toString('hex')}`;
    await CheckoutSessionSnapshot.create({
      stripeSessionId: sessionId,
      user: user._id,
      lines: [{ product: product._id, quantity: 1, price: 5 }],
    });

    const payload = {
      id: `evt_snap_${crypto.randomBytes(4).toString('hex')}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          amount_total: 500,
          metadata: {
            userId: user._id.toString(),
            shippingAddress: JSON.stringify({ street: '1', city: 'C', country: 'X', zipCode: '1' }),
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const header = stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    const app = createApp(env);
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', header)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(res.status).toBe(200);
    const orders = await Order.find({ stripeSessionId: sessionId });
    expect(orders).toHaveLength(1);
    expect(await CheckoutSessionSnapshot.countDocuments({ stripeSessionId: sessionId })).toBe(0);
    const refreshed = await Product.findById(product._id);
    expect(refreshed?.quantity).toBe(3);
  });
});
