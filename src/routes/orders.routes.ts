import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as orderController from '../controllers/order.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { mongoId } from '../validation/catalog.schemas.js';
import { createOrderSchema } from '../validation/order.schemas.js';

const idParamSchema = z.object({ id: mongoId });

export function createOrdersRouter(env: Env): Router {
  const r = Router();
  const authProtect = protect(env);
  r.use(authProtect);
  r.post('/', validateRequest(createOrderSchema), orderController.createOrder);
  r.get('/myOrders', orderController.getMyOrders);
  r.get('/', allowedTo('admin', 'manager'), orderController.getAllOrders);
  r.put('/:id/cancel', validateRequest(idParamSchema, 'params'), orderController.cancelOrder);
  r
    .route('/:id')
    .get(validateRequest(idParamSchema, 'params'), orderController.getOrder)
    .put(allowedTo('admin', 'manager'), validateRequest(idParamSchema, 'params'), orderController.updateOrder)
    .delete(allowedTo('admin', 'manager'), validateRequest(idParamSchema, 'params'), orderController.deleteOrder);
  return r;
}
