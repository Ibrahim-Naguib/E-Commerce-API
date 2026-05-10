import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { Category } from '../src/models/Category.js';
import { User } from '../src/models/User.js';
import * as cloudinaryService from '../src/services/cloudinary.js';

describe('Cloudinary-backed category image', () => {
  it('persists mocked image URL on create', async () => {
    vi.spyOn(cloudinaryService, 'uploadImageBuffer').mockResolvedValue('https://cdn.example.com/cat.jpg');

    const admin = await User.create({
      name: 'Admin',
      email: `admin_${crypto.randomBytes(4).toString('hex')}@test.com`,
      password: 'password123',
      role: 'admin',
    });

    const tokenRes = await request(createApp(getEnv()))
      .post('/api/v1/auth/signin')
      .send({ email: admin.email, password: 'password123' });
    const token = tokenRes.body.accessToken as string;

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(createApp(getEnv()))
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'CloudCat')
      .attach('image', png, 'x.png');

    expect(res.status).toBe(201);
    expect(res.body.data.image).toBe('https://cdn.example.com/cat.jpg');
    const saved = await Category.findById(res.body.data._id);
    expect(saved?.image).toBe('https://cdn.example.com/cat.jpg');
    vi.restoreAllMocks();
  });
});
