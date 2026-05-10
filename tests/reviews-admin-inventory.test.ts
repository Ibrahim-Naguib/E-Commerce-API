import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';

const longDesc = 'Description long enough for validation rules here';

describe('reviews, admin stats, inventory dashboard', () => {
  it('creates a review on a product and returns 403 for non-admin on admin route', async () => {
    const cat = await Category.create({ name: 'RevCat', slug: `rev-${crypto.randomBytes(4).toString('hex')}` });
    const product = await Product.create({
      title: 'Reviewable product title',
      slug: `rev-p-${crypto.randomBytes(4).toString('hex')}`,
      description: longDesc,
      quantity: 5,
      price: 9,
      imageCover: 'https://cdn.example.com/r.jpg',
      category: cat._id,
    });
    const user = await User.create({
      name: 'Reviewer',
      email: `rev_${crypto.randomBytes(4).toString('hex')}@t.com`,
      password: 'password123',
      role: 'user',
    });
    const app = createApp(getEnv());
    const token = (
      await request(app).post('/api/v1/auth/signin').send({ email: user.email, password: 'password123' })
    ).body.accessToken as string;

    const res = await request(app)
      .post(`/api/v1/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
        title: 'Great',
        comment: 'Solid purchase would recommend to others here',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);

    const list = await request(app).get(`/api/v1/products/${product._id.toString()}/reviews`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);

    const adminProbe = await request(app)
      .get('/api/v1/admin/stats/overview')
      .set('Authorization', `Bearer ${token}`);
    expect(adminProbe.status).toBe(403);
  });

  it('allows admin to read overview stats and manager to read inventory', async () => {
    const admin = await User.create({
      name: 'AdminUser',
      email: `adm_${crypto.randomBytes(4).toString('hex')}@t.com`,
      password: 'password123',
      role: 'admin',
    });
    const manager = await User.create({
      name: 'MgrUser',
      email: `mgr_${crypto.randomBytes(4).toString('hex')}@t.com`,
      password: 'password123',
      role: 'manager',
    });
    const cat = await Category.create({ name: 'InvCat', slug: `inv-${crypto.randomBytes(4).toString('hex')}` });
    await Product.create({
      title: 'Stock product title ok',
      slug: `inv-p-${crypto.randomBytes(4).toString('hex')}`,
      description: longDesc,
      quantity: 3,
      price: 7,
      imageCover: 'https://cdn.example.com/i.jpg',
      category: cat._id,
    });

    const app = createApp(getEnv());
    const adminToken = (
      await request(app).post('/api/v1/auth/signin').send({ email: admin.email, password: 'password123' })
    ).body.accessToken as string;
    const mgrToken = (
      await request(app).post('/api/v1/auth/signin').send({ email: manager.email, password: 'password123' })
    ).body.accessToken as string;

    const overview = await request(app)
      .get('/api/v1/admin/stats/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(overview.status).toBe(200);
    expect(overview.body.data.totalProducts).toBeGreaterThanOrEqual(1);

    const inv = await request(app).get('/api/v1/inventory').set('Authorization', `Bearer ${mgrToken}`);
    expect(inv.status).toBe(200);
    expect(inv.body.status).toBe('success');
  });
});
