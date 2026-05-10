import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';

describe('wishlist', () => {
  it('adds, checks, lists, removes, and clears wishlist items', async () => {
    const cat = await Category.create({ name: 'WishCat', slug: `wish-${crypto.randomBytes(4).toString('hex')}` });
    const product = await Product.create({
      title: 'Wish item title ok',
      slug: `wish-p-${crypto.randomBytes(4).toString('hex')}`,
      description: 'Description long enough for validation rules here',
      quantity: 5,
      price: 12,
      imageCover: 'https://cdn.example.com/w.jpg',
      category: cat._id,
    });
    const user = await User.create({
      name: 'Wisher',
      email: `wish_${crypto.randomBytes(4).toString('hex')}@t.com`,
      password: 'password123',
      role: 'user',
    });
    const app = createApp(getEnv());
    const token = (
      await request(app).post('/api/v1/auth/signin').send({ email: user.email, password: 'password123' })
    ).body.accessToken as string;

    const add = await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(add.status).toBe(200);

    const dup = await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(dup.status).toBe(400);

    const check = await request(app)
      .get(`/api/v1/wishlist/check/${product._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.status).toBe(200);
    expect(check.body.data.isInWishlist).toBe(true);

    const list = await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.results).toBe(1);

    const remove = await request(app)
      .delete(`/api/v1/wishlist/${product._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);

    const after = await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${token}`);
    expect(after.body.results).toBe(0);

    await request(app)
      .post(`/api/v1/wishlist/${product._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    const cleared = await request(app).delete('/api/v1/wishlist').set('Authorization', `Bearer ${token}`);
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.products).toHaveLength(0);
  });
});
