import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as inventoryController from '../controllers/inventory.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { mongoId } from '../validation/catalog.schemas.js';

const productIdParam = z.object({ id: mongoId });

const updateStockSchema = z.object({
  quantity: z.coerce.number().nonnegative(),
  operation: z.enum(['set', 'add', 'subtract']).optional(),
});

const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      productId: mongoId,
      quantity: z.coerce.number().nonnegative(),
      operation: z.enum(['set', 'add', 'subtract']).optional(),
    })
  ),
});

export function createInventoryRouter(env: Env): Router {
  const r = Router();
  r.use(protect(env));
  r.use(allowedTo('admin', 'manager'));
  r.get('/', inventoryController.getInventoryStatus);
  r.get('/alerts', inventoryController.getLowStockAlerts);
  r.get('/product/:id', validateRequest(productIdParam, 'params'), inventoryController.getProductInventory);
  r.put(
    '/product/:id/stock',
    validateRequest(productIdParam, 'params'),
    validateRequest(updateStockSchema),
    inventoryController.updateProductStock
  );
  r.put('/bulk-update', validateRequest(bulkUpdateSchema), inventoryController.bulkUpdateStock);
  return r;
}
