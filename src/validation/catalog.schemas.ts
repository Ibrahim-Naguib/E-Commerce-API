import { z } from 'zod';

export const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createCategorySchema = z.object({
  name: z.string().min(3).max(32),
  slug: z.string().optional(),
  image: z.string().url().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createSubCategorySchema = z.object({
  name: z.string().min(2).max(32),
  slug: z.string().optional(),
  category: mongoId,
});

export const updateSubCategorySchema = createSubCategorySchema.partial();

export const createBrandSchema = z.object({
  name: z.string().min(3).max(32),
  slug: z.string().optional(),
  image: z.string().url().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();
