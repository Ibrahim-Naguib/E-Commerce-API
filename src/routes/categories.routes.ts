import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as categoryController from '../controllers/category.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { processCategoryImage } from '../middleware/imageCloudinary.js';
import { slugFromName } from '../middleware/slugFromName.js';
import { uploadSingleImage } from '../middleware/uploadMemory.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createCategorySchema, mongoId, updateCategorySchema } from '../validation/catalog.schemas.js';
import { createSubcategoriesRouter } from './subcategories.routes.js';

const idParamSchema = z.object({ id: mongoId });

export function createCategoriesRouter(env: Env): Router {
  const r = Router();
  const authProtect = protect(env);

  r.use('/:categoryId/subcategories', createSubcategoriesRouter(env));

  r
    .route('/')
    .get(categoryController.getCategories)
    .post(
      authProtect,
      allowedTo('admin', 'manager'),
      uploadSingleImage('image'),
      processCategoryImage(env),
      slugFromName(),
      validateRequest(createCategorySchema),
      categoryController.createCategory
    );
  r
    .route('/:id')
    .get(validateRequest(idParamSchema, 'params'), categoryController.getCategory)
    .put(
      authProtect,
      allowedTo('admin', 'manager'),
      uploadSingleImage('image'),
      processCategoryImage(env),
      slugFromName(),
      validateRequest(updateCategorySchema),
      categoryController.updateCategory
    )
    .delete(authProtect, allowedTo('admin'), validateRequest(idParamSchema, 'params'), categoryController.deleteCategory);

  return r;
}
