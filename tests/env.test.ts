import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseEnv, resetEnvCache } from '../src/config/env.js';

describe('env validation', () => {
  it('throws when required secrets are missing', () => {
    resetEnvCache();
    expect(() =>
      parseEnv({
        NODE_ENV: 'test',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/x',
        JWT_ACCESS_SECRET: 'short',
        JWT_REFRESH_SECRET: 'test-refresh-secret-1234567890',
        BASE_URL: 'http://localhost:8000',
        RESEND_API_KEY: 're_test_key_1234567890',
      }),
    ).toThrow(z.ZodError);
  });
});
