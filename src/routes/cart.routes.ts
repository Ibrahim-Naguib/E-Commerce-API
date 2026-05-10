import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as cartController from '../controllers/cart.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { mongoId } from '../validation/catalog.schemas.js';
import {
  addToCartSchema,
  applyCouponSchema,
  syncCartSchema,
  updateCartItemSchema,
} from '../validation/cart.schemas.js';

const itemIdParam = z.object({ itemId: mongoId });

export function createCartRouter(env: Env): Router {
  const r = Router();
  r.use(protect(env));
  r.use(allowedTo('user', 'admin'));
  r.post('/', validateRequest(addToCartSchema), cartController.addProductToCart);
  r.get('/', cartController.getLoggedUserCart);
  r.delete('/', cartController.clearCart);
  r.put('/applyCoupon', validateRequest(applyCouponSchema), cartController.applyCoupon);
  r.post('/sync', validateRequest(syncCartSchema), cartController.syncCart);
  r.put('/:itemId', validateRequest(itemIdParam, 'params'), validateRequest(updateCartItemSchema), cartController.updateCartItemQuantity);
  r.delete('/:itemId', validateRequest(itemIdParam, 'params'), cartController.removeSpecificCartItem);
  return r;
}
