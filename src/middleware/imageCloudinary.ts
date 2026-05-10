import type { RequestHandler } from 'express';
import sharp from 'sharp';
import type { Env } from '../config/env.js';
import { uploadImageBuffer } from '../services/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';

function assertCloudinary(env: Env): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError('Cloudinary is not configured', 500);
  }
}

export function processCategoryImage(env: Env): RequestHandler {
  return async (req, _res, next) => {
    if (!req.file?.buffer) return next();
    assertCloudinary(env);
    const buf = await sharp(req.file.buffer).resize(600, 600).jpeg({ quality: 90 }).toBuffer();
    (req.body as { image?: string }).image = await uploadImageBuffer(buf, 'ecom/categories');
    next();
  };
}

export function processBrandImage(env: Env): RequestHandler {
  return async (req, _res, next) => {
    if (!req.file?.buffer) return next();
    assertCloudinary(env);
    const buf = await sharp(req.file.buffer).resize(600, 600).jpeg({ quality: 90 }).toBuffer();
    (req.body as { image?: string }).image = await uploadImageBuffer(buf, 'ecom/brands');
    next();
  };
}

export function processUserProfileImage(env: Env): RequestHandler {
  return async (req, _res, next) => {
    if (!req.file?.buffer) return next();
    assertCloudinary(env);
    const buf = await sharp(req.file.buffer).resize(600, 600).jpeg({ quality: 90 }).toBuffer();
    (req.body as { profileImg?: string }).profileImg = await uploadImageBuffer(buf, 'ecom/users');
    next();
  };
}

export function processProductImages(env: Env): RequestHandler {
  return async (req, _res, next) => {
    assertCloudinary(env);
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const body = req.body as { imageCover?: string; images?: string[] };

    if (files?.imageCover?.[0]?.buffer) {
      const buf = await sharp(files.imageCover[0].buffer).resize(2000, 1333).jpeg({ quality: 90 }).toBuffer();
      body.imageCover = await uploadImageBuffer(buf, 'ecom/products/cover');
    }
    if (files?.images?.length) {
      body.images = [];
      for (const [index, img] of files.images.entries()) {
        if (!img.buffer) continue;
        const buf = await sharp(img.buffer).resize(2000, 1333).jpeg({ quality: 90 }).toBuffer();
        body.images.push(await uploadImageBuffer(buf, `ecom/products/gallery/${index}`));
      }
    }
    next();
  };
}
