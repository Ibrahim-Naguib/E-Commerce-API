import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { User } from '../src/models/User.js';

describe('auth', () => {
  const app = () => createApp(getEnv());

  it('signs up and signs in', async () => {
    const email = `u_${crypto.randomBytes(4).toString('hex')}@t.com`;
    const res = await request(app()).post('/api/v1/auth/signup').send({
      name: 'Test User',
      email,
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();

    const res2 = await request(app()).post('/api/v1/auth/signin').send({
      email,
      password: 'password123',
    });
    expect(res2.status).toBe(200);
    expect(res2.body.accessToken).toBeTruthy();
  });

  it('returns 400 for invalid reset code', async () => {
    const res = await request(app()).post('/api/v1/auth/verifyResetCode').send({ resetCode: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid|expired/i);
  });

  it('rejects wrong password on signin', async () => {
    const email = `u_${crypto.randomBytes(4).toString('hex')}@t.com`;
    await User.create({ name: 'A', email, password: 'password123' });
    const res = await request(app()).post('/api/v1/auth/signin').send({
      email,
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });
});
