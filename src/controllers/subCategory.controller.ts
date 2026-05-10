import type { NextFunction, Request, Response } from 'express';
import { SubCategory } from '../models/SubCategory.js';
import { createHandler, deleteHandler, getAllHandler, getByIdHandler, updateHandler } from './handlers.js';

export const createFilterObject = (req: Request, _res: Response, next: NextFunction) => {
  if (req.params.categoryId) {
    req.filterObject = { category: req.params.categoryId };
  }
  next();
};

export const setCategoryIdToBody = (req: Request, _res: Response, next: NextFunction) => {
  const body = req.body as Record<string, unknown>;
  if (!body.category && req.params.categoryId) {
    body.category = req.params.categoryId;
  }
  next();
};

export const getSubCategories = getAllHandler(SubCategory, '');
export const createSubCategory = createHandler(SubCategory);
export const getSubCategory = getByIdHandler(SubCategory, 'subcategory');
export const updateSubCategory = updateHandler(SubCategory);
export const deleteSubCategory = deleteHandler(SubCategory);
