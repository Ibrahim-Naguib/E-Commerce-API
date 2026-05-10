import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as wishlistController from '../controllers/wishlist.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { mongoId } from '../validation/catalog.schemas.js';

const productIdParam = z.object({ productId: mongoId });

export function createWishlistRouter(env: Env): Router {
  const r = Router();
  r.use(protect(env));
  r.use(allowedTo('user', 'admin'));
  r.get('/', wishlistController.getWishlist);
  r.get('/check/:productId', validateRequest(productIdParam, 'params'), wishlistController.checkProductInWishlist);
  r.post('/:productId', validateRequest(productIdParam, 'params'), wishlistController.addToWishlist);
  r.delete('/:productId', validateRequest(productIdParam, 'params'), wishlistController.removeFromWishlist);
  r.delete('/', wishlistController.clearWishlist);
  return r;
}
