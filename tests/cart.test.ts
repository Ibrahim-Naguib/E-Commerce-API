import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { Category } from '../src/models/Category.js';
import { Coupon } from '../src/models/Coupon.js';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';

async function seedUserCartProduct() {
  const user = await User.create({
    name: 'Shopper',
    email: `shop_${crypto.randomBytes(4).toString('hex')}@t.com`,
    password: 'password123',
    role: 'user',
  });
  const cat = await Category.create({ name: 'Cat', slug: 'cat-seed' });
  const product = await Product.create({
    title: 'Widget title long enough',
    slug: 'widget',
    description: 'Description long enough for validation rules here',
    quantity: 5,
    price: 10,
    imageCover: 'https://cdn.example.com/w.jpg',
    category: cat._id,
  });
  return { user, product };
}

describe('cart & coupons', () => {
  it('applies coupon and clears discount base before discount', async () => {
    const { user, product } = await seedUserCartProduct();
    const app = createApp(getEnv());
    const token = (
      await request(app).post('/api/v1/auth/signin').send({ email: user.email, password: 'password123' })
    ).body.accessToken as string;

    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString() });

    await Coupon.create({
      name: 'SAVE10',
      expire: new Date(Date.now() + 86400000),
      discount: 10,
    });

    const res = await request(app)
      .put('/api/v1/cart/applyCoupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ coupon: 'SAVE10' });

    expect(res.status).toBe(200);
    expect(res.body.data.totalPriceAfterDiscount).toBeLessThan(res.body.data.totalCartPrice);
  });

  it('returns 404 when applying coupon without cart', async () => {
    const user = await User.create({
      name: 'NoCart',
      email: `nocart_${crypto.randomBytes(4).toString('hex')}@t.com`,
      password: 'password123',
      role: 'user',
    });
    const app = createApp(getEnv());
    const token = (
      await request(app).post('/api/v1/auth/signin').send({ email: user.email, password: 'password123' })
    ).body.accessToken as string;

    await Coupon.create({
      name: 'SAVE20',
      expire: new Date(Date.now() + 86400000),
      discount: 20,
    });

    const res = await request(app)
      .put('/api/v1/cart/applyCoupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ coupon: 'SAVE20' });
    expect(res.status).toBe(404);
  });
});
