import { Brand } from '../models/Brand.js';
import { createHandler, deleteHandler, getAllHandler, getByIdHandler, updateHandler } from './handlers.js';

export const getBrands = getAllHandler(Brand, '');
export const getBrand = getByIdHandler(Brand, 'brand');
export const createBrand = createHandler(Brand);
export const updateBrand = updateHandler(Brand);
export const deleteBrand = deleteHandler(Brand);
