import { z } from 'zod';

export const createCouponSchema = z.object({
  name: z.string().min(1),
  expire: z.coerce.date(),
  discount: z.coerce.number().positive(),
});

export const validateCouponBodySchema = z.object({
  couponName: z.string().min(1),
});
