import { Router } from 'express';
import type { Env } from '../config/env.js';
import * as adminController from '../controllers/admin.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';

export function createAdminRouter(env: Env): Router {
  const r = Router();
  r.use(protect(env));
  r.use(allowedTo('admin'));
  r.get('/stats/overview', adminController.getOverviewStats);
  r.get('/stats/sales', adminController.getSalesStats);
  r.get('/stats/top-products', adminController.getTopProductsStats);
  return r;
}
