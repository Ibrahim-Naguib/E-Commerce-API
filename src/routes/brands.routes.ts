import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as brandController from '../controllers/brand.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { processBrandImage } from '../middleware/imageCloudinary.js';
import { slugFromName } from '../middleware/slugFromName.js';
import { uploadSingleImage } from '../middleware/uploadMemory.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createBrandSchema, mongoId, updateBrandSchema } from '../validation/catalog.schemas.js';

const idParamSchema = z.object({ id: mongoId });

export function createBrandsRouter(env: Env): Router {
  const r = Router();
  const authProtect = protect(env);
  r.route('/')
    .get(brandController.getBrands)
    .post(
      authProtect,
      allowedTo('admin', 'manager'),
      uploadSingleImage('image'),
      processBrandImage(env),
      slugFromName(),
      validateRequest(createBrandSchema),
      brandController.createBrand
    );
  r
    .route('/:id')
    .get(validateRequest(idParamSchema, 'params'), brandController.getBrand)
    .put(
      authProtect,
      allowedTo('admin', 'manager'),
      uploadSingleImage('image'),
      processBrandImage(env),
      slugFromName(),
      validateRequest(updateBrandSchema),
      brandController.updateBrand
    )
    .delete(authProtect, allowedTo('admin'), validateRequest(idParamSchema, 'params'), brandController.deleteBrand);
  return r;
}
