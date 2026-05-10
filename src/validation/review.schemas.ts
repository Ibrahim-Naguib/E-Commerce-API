import { z } from 'zod';
import { mongoId } from './catalog.schemas.js';

export const createReviewSchema = z.object({
  product: mongoId.optional(),
  rating: z.coerce.number().min(1).max(5),
  title: z.string().min(1).max(100),
  comment: z.string().min(1).max(500),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce.number().min(1).max(5).optional(),
    title: z.string().min(1).max(100).optional(),
    comment: z.string().min(1).max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field' });
