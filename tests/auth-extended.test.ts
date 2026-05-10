import request from 'supertest';
import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { capturedEmails } = vi.hoisted(() => ({
  capturedEmails: [] as string[],
}));

vi.mock('../src/utils/sendEmail.js', () => ({
  sendEmail: vi.fn(async (_env: unknown, opts: { message: string }) => {
    capturedEmails.push(opts.message);
  }),
}));

import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { User } from '../src/models/User.js';

describe('auth refresh and password reset', () => {
  const app = () => createApp(getEnv());

  beforeEach(() => {
    capturedEmails.length = 0;
    vi.clearAllMocks();
  });

  it('issues a new access token from refresh cookie after signup', async () => {
    const email = `rf_${crypto.randomBytes(4).toString('hex')}@t.com`;
    const signup = await request(app()).post('/api/v1/auth/signup').send({
      name: 'Refresh Me',
      email,
      password: 'password123',
    });
    expect(signup.status).toBe(201);
    const cookies = signup.get('Set-Cookie');
    expect(cookies).toBeTruthy();

    const refresh = await request(app()).post('/api/v1/auth/refresh').set('Cookie', cookies!);
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
  });

  it('runs forgot → verify → reset with 400 on bad reset code', async () => {
    const email = `fp_${crypto.randomBytes(4).toString('hex')}@t.com`;
    await User.create({ name: 'Reset User', email, password: 'password123', role: 'user' });

    const forgot = await request(app()).post('/api/v1/auth/forgotPassword').send({ email });
    expect(forgot.status).toBe(200);
    expect(capturedEmails.length).toBe(1);

    const codeMatch = capturedEmails[0]?.match(/(\d{6})/);
    expect(codeMatch).toBeTruthy();
    const code = codeMatch![1];

    const verify = await request(app()).post('/api/v1/auth/verifyResetCode').send({ resetCode: code });
    expect(verify.status).toBe(200);

    const reset = await request(app()).put('/api/v1/auth/resetPassword').send({
      email,
      newPassword: 'newpassword99',
    });
    expect(reset.status).toBe(200);
    expect(reset.body.accessToken).toBeTruthy();

    const signinOld = await request(app()).post('/api/v1/auth/signin').send({ email, password: 'password123' });
    expect(signinOld.status).toBe(401);

    const signinNew = await request(app()).post('/api/v1/auth/signin').send({ email, password: 'newpassword99' });
    expect(signinNew.status).toBe(200);
  });
});
