import type { NextFunction, Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';

export const assertCategoryExists = async (req: Request, _res: Response, next: NextFunction) => {
  const id = (req.body as { category?: string }).category;
  if (!id) {
    return next(new ApiError('Product category is required', 400));
  }
  const category = await Category.findById(id);
  if (!category) {
    return next(new ApiError(`No category found for this id ${id}`, 404));
  }
  next();
};
