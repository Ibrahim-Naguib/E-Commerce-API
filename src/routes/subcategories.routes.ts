import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as subCategoryController from '../controllers/subCategory.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { slugFromName } from '../middleware/slugFromName.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createSubCategorySchema, mongoId, updateSubCategorySchema } from '../validation/catalog.schemas.js';

const idParamSchema = z.object({ id: mongoId });

export function createSubcategoriesRouter(env: Env): Router {
  const r = Router({ mergeParams: true });
  const authProtect = protect(env);

  r.route('/')
    .get(subCategoryController.createFilterObject, subCategoryController.getSubCategories)
    .post(
      authProtect,
      allowedTo('admin', 'manager'),
      subCategoryController.setCategoryIdToBody,
      slugFromName(),
      validateRequest(createSubCategorySchema),
      subCategoryController.createSubCategory
    );
  r.route('/:id')
    .get(validateRequest(idParamSchema, 'params'), subCategoryController.getSubCategory)
    .put(
      authProtect,
      allowedTo('admin', 'manager'),
      validateRequest(updateSubCategorySchema),
      subCategoryController.updateSubCategory
    )
    .delete(authProtect, allowedTo('admin'), validateRequest(idParamSchema, 'params'), subCategoryController.deleteSubCategory);

  return r;
}

export function createStandaloneSubcategoriesRouter(env: Env): Router {
  const r = Router();
  const authProtect = protect(env);
  r.route('/')
    .get(subCategoryController.getSubCategories)
    .post(
      authProtect,
      allowedTo('admin', 'manager'),
      slugFromName(),
      validateRequest(createSubCategorySchema),
      subCategoryController.createSubCategory
    );
  r.route('/:id')
    .get(validateRequest(idParamSchema, 'params'), subCategoryController.getSubCategory)
    .put(
      authProtect,
      allowedTo('admin', 'manager'),
      validateRequest(updateSubCategorySchema),
      subCategoryController.updateSubCategory
    )
    .delete(authProtect, allowedTo('admin'), validateRequest(idParamSchema, 'params'), subCategoryController.deleteSubCategory);
  return r;
}
