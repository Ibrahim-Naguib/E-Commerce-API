import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as couponController from '../controllers/coupon.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { couponValidationLimiter } from '../middleware/rateLimit.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { mongoId } from '../validation/catalog.schemas.js';
import { createCouponSchema } from '../validation/coupon.schemas.js';
import { validateCouponBodySchema } from '../validation/coupon.schemas.js';

const idParamSchema = z.object({ id: mongoId });

export function createCouponsRouter(env: Env): Router {
  const r = Router();
  r.post('/validate', couponValidationLimiter, validateRequest(validateCouponBodySchema), couponController.validateCoupon);

  r.use(protect(env));
  r.use(allowedTo('admin', 'manager'));
  r.route('/')
    .get(couponController.getCoupons)
    .post(validateRequest(createCouponSchema), couponController.createCoupon);
  r
    .route('/:id')
    .get(validateRequest(idParamSchema, 'params'), couponController.getCoupon)
    .put(validateRequest(idParamSchema, 'params'), validateRequest(createCouponSchema.partial()), couponController.updateCoupon)
    .delete(validateRequest(idParamSchema, 'params'), couponController.deleteCoupon);
  return r;
}
