import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { Cart } from '../src/models/Cart.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';

const address = { street: '1', city: 'C', country: 'X', zipCode: '1' };

describe('order stock (transactions)', () => {
  it('allows only one of two concurrent orders when stock is 1', async () => {
    const cat = await Category.create({ name: 'OCat', slug: 'ocat' });
    const product = await Product.create({
      title: 'Limited title long enough',
      slug: 'limited',
      description: 'Description long enough for validation rules here',
      quantity: 1,
      price: 10,
      imageCover: 'https://cdn.example.com/p.jpg',
      category: cat._id,
    });

    const mkUser = async () => {
      const email = `u_${crypto.randomBytes(5).toString('hex')}@t.com`;
      const user = await User.create({ name: 'B', email, password: 'password123', role: 'user' });
      await Cart.create({
        user: user._id,
        cartItems: [{ product: product._id, quantity: 1, price: 10 }],
        totalCartPrice: 10,
      });
      return user;
    };

    const u1 = await mkUser();
    const u2 = await mkUser();
    const app = createApp(getEnv());

    const t1 = (await request(app).post('/api/v1/auth/signin').send({ email: u1.email, password: 'password123' })).body
      .accessToken as string;
    const t2 = (await request(app).post('/api/v1/auth/signin').send({ email: u2.email, password: 'password123' })).body
      .accessToken as string;

    const [a, b] = await Promise.all([
      request(app).post('/api/v1/orders').set('Authorization', `Bearer ${t1}`).send({ shippingAddress: address }),
      request(app).post('/api/v1/orders').set('Authorization', `Bearer ${t2}`).send({ shippingAddress: address }),
    ]);

    const successes = [a, b].filter((r) => r.status === 201);
    const failures = [a, b].filter((r) => r.status !== 201);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0]!.status).toBeGreaterThanOrEqual(400);
  });
});
