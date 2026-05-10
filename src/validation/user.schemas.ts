import { z } from 'zod';
import { mongoId } from './catalog.schemas.js';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['user', 'manager', 'admin']).optional(),
  profileImg: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  profileImg: z.string().url().optional(),
  role: z.enum(['user', 'manager', 'admin']).optional(),
});

export const changePasswordSchema = z.object({
  password: z.string().min(6),
});

export const updateLoggedUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const updateLoggedUserPasswordSchema = z.object({
  password: z.string().min(6),
});

export const mongoIdParamSchema = z.object({ id: mongoId });
