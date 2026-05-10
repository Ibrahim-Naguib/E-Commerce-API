import { z } from 'zod';
import { mongoId } from './catalog.schemas.js';

const productBaseSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z.string().optional(),
  description: z.string().min(20).max(2000),
  quantity: z.coerce.number().nonnegative(),
  sold: z.coerce.number().nonnegative().optional(),
  price: z.coerce.number().positive(),
  priceAfterDiscount: z.coerce.number().optional(),
  colors: z.array(z.string()).optional(),
  imageCover: z.string().min(1),
  images: z.array(z.string().url()).optional(),
  category: mongoId,
  subcategories: z.array(mongoId).optional(),
  brand: mongoId.optional(),
});

export const createProductSchema = productBaseSchema.superRefine((data, ctx) => {
  if (data.priceAfterDiscount != null && data.priceAfterDiscount >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Price after discount must be less than the price',
      path: ['priceAfterDiscount'],
    });
  }
});

export const updateProductSchema = productBaseSchema.partial();
