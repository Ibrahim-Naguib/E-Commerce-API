import { Category } from '../models/Category.js';
import { createHandler, deleteHandler, getAllHandler, getByIdHandler, updateHandler } from './handlers.js';

export const getCategories = getAllHandler(Category, '');
export const getCategory = getByIdHandler(Category, 'category');
export const createCategory = createHandler(Category);
export const updateCategory = updateHandler(Category);
export const deleteCategory = deleteHandler(Category);
