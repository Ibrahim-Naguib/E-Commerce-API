import { v2 as cloudinary } from 'cloudinary';
import type { Env } from '../config/env.js';

export function configureCloudinary(env: Env): void {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
}

export async function uploadImageBuffer(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err || !result?.secure_url) {
        reject(err ?? new Error('Cloudinary upload failed'));
        return;
      }
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}
