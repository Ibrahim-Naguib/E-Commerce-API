import mongoose from 'mongoose';
import type { Env } from './env.js';

export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function getMongoUriForEnv(env: Env): string {
  return env.MONGODB_URI;
}
