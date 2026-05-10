import request from 'supertest';
import express from 'express';
import { describe, expect, it } from 'vitest';
import { errorMiddleware } from '../src/middleware/errorMiddleware.js';
import { ApiError } from '../src/utils/ApiError.js';

describe('error middleware', () => {
  it('maps unknown routes to 404 via ApiError', async () => {
    const app = express();
    app.get('/ok', (_req, res) => res.json({ ok: true }));
    app.use((_req, _res, next) => next(new ApiError('missing', 404)));
    app.use(errorMiddleware);
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
});
