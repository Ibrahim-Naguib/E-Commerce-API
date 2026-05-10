import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  ACCESS_EXPIRE_TIME: z.string().default('15m'),
  REFRESH_EXPIRE_TIME: z.string().default('7d'),
  BASE_URL: z.string().url(),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

function loadDotenvFiles(): void {
  const root = process.cwd();
  for (const file of ['config.env', '.env', '.env.test']) {
    const full = path.join(root, file);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full });
    }
  }
}

export function parseEnv(overrides?: Record<string, string | undefined>): Env {
  loadDotenvFiles();
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== undefined) process.env[k] = v;
    }
  }
  return envSchema.parse(process.env);
}

export function getEnv(): Env {
  if (!cached) {
    cached = parseEnv();
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}

/** Merge overrides into `process.env` and clear the env cache (for tests). */
export function loadTestEnv(overrides: Record<string, string>): void {
  resetEnvCache();
  Object.assign(process.env, overrides);
}
