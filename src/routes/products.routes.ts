import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as productController from '../controllers/product.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { assertCategoryExists } from '../middleware/assertCategory.js';
import { processProductImages } from '../middleware/imageCloudinary.js';
import { slugFromName } from '../middleware/slugFromName.js';
import { uploadMixOfImages } from '../middleware/uploadMemory.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { mongoId } from '../validation/catalog.schemas.js';
import { createProductSchema, updateProductSchema } from '../validation/product.schemas.js';
import { createReviewRouter } from './reviews.routes.js';

const idParamSchema = z.object({ id: mongoId });

const uploadProductImages = uploadMixOfImages([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

export function createProductsRouter(env: Env): Router {
  const r = Router();
  const authProtect = protect(env);

  r.use('/:productId/reviews', createReviewRouter(env));

  r.route('/')
    .get(productController.getProducts)
    .post(
      authProtect,
      allowedTo('admin', 'manager'),
      uploadProductImages,
      processProductImages(env),
      slugFromName('title'),
      validateRequest(createProductSchema),
      assertCategoryExists,
      productController.createProduct
    );
  r
    .route('/:id')
    .get(validateRequest(idParamSchema, 'params'), productController.getProduct)
    .put(
      authProtect,
      allowedTo('admin', 'manager'),
      uploadProductImages,
      processProductImages(env),
      slugFromName('title'),
      validateRequest(updateProductSchema),
      productController.updateProduct
    )
    .delete(authProtect, allowedTo('admin'), validateRequest(idParamSchema, 'params'), productController.deleteProduct);

  return r;
}
