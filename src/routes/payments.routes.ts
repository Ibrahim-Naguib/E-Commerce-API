import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import { buildPaymentController } from '../controllers/payment.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { checkoutSessionSchema, processPaymentSchema } from '../validation/order.schemas.js';

const sessionIdParam = z.object({ sessionId: z.string().min(1) });

export function createPaymentsRouter(env: Env): Router {
  const r = Router();
  const c = buildPaymentController(env);
  const authProtect = protect(env);
  r.use(authProtect);
  r.use(allowedTo('user', 'admin'));
  r.post('/checkout-session', validateRequest(checkoutSessionSchema), c.createCheckoutSession);
  r.get('/session/:sessionId', validateRequest(sessionIdParam, 'params'), c.getCheckoutSession);
  r.post('/process', validateRequest(processPaymentSchema), c.processPayment);
  return r;
}
