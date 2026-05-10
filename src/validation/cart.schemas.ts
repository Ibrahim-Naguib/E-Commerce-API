import { z } from 'zod';
import { mongoId } from './catalog.schemas.js';

export const addToCartSchema = z.object({
  productId: mongoId,
  color: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const applyCouponSchema = z.object({
  coupon: z.string().min(1),
});

export const syncCartSchema = z.object({
  cartItems: z.array(
    z.object({
      product: mongoId,
      quantity: z.coerce.number().int().positive(),
      color: z.string().optional(),
    })
  ),
});
