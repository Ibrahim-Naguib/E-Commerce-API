import { Product } from '../models/Product.js';
import { createHandler, deleteHandler, getAllHandler, getByIdHandler, updateHandler } from './handlers.js';

export const getProducts = getAllHandler(Product, 'Product');
export const getProduct = getByIdHandler(Product, 'product');
export const createProduct = createHandler(Product);
export const updateProduct = updateHandler(Product);
export const deleteProduct = deleteHandler(Product);
