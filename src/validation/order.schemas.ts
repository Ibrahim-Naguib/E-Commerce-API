import { z } from 'zod';

export const shippingAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  zipCode: z.string().min(1),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['cash', 'card', 'paypal', 'stripe']).optional(),
  phone: z.string().optional(),
});

export const processPaymentSchema = z.object({
  paymentMethodId: z.string().min(1),
  shippingAddress: shippingAddressSchema,
});

export const checkoutSessionSchema = z.object({
  shippingAddress: shippingAddressSchema,
});
