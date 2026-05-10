import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { loadTestEnv, resetEnvCache } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  loadTestEnv({
    NODE_ENV: 'test',
    MONGODB_URI: uri,
    JWT_ACCESS_SECRET: 'test-access-secret-1234567890',
    JWT_REFRESH_SECRET: 'test-refresh-secret-1234567890',
    ACCESS_EXPIRE_TIME: '15m',
    REFRESH_EXPIRE_TIME: '7d',
    BASE_URL: 'http://localhost:8000',
    CLIENT_ORIGIN: 'http://localhost:3000',
    STRIPE_SECRET_KEY: 'sk_test_dummy',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy',
    CLOUDINARY_CLOUD_NAME: 'demo',
    CLOUDINARY_API_KEY: 'demo',
    CLOUDINARY_API_SECRET: 'demo',
  });
  await connectDatabase(uri);
}, 120_000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
});

afterAll(async () => {
  await disconnectDatabase();
  await replSet.stop();
  resetEnvCache();
}, 60_000);
