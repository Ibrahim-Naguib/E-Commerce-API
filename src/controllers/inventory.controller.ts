import type { NextFunction, Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { toInventoryAlertProduct, toInventoryProductView, type InventoryProductShape } from '../utils/inventoryProduct.js';
import { reserveStock } from '../services/inventory.service.js';

export { reserveStock };

export const getInventoryStatus = async (req: Request, res: Response) => {
  const { lowStock = '10', category, status } = req.query as {
    lowStock?: string;
    category?: string;
    status?: string;
  };
  const lowStockNum = Number(lowStock) || 10;

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;

  const products = await Product.find(filter)
    .populate('category', 'name')
    .select('title slug quantity sold price category')
    .lean<InventoryProductShape[]>();

  let mapped = products.map((product) => toInventoryProductView(product, lowStockNum));

  if (status) {
    mapped = mapped.filter((p) => p.inventoryStatus === status);
  }

  const inventory = {
    in_stock: mapped.filter((p) => p.inventoryStatus === 'in_stock'),
    low_stock: mapped.filter((p) => p.inventoryStatus === 'low_stock'),
    out_of_stock: mapped.filter((p) => p.inventoryStatus === 'out_of_stock'),
  };

  const summary = {
    total_products: mapped.length,
    in_stock_count: inventory.in_stock.length,
    low_stock_count: inventory.low_stock.length,
    out_of_stock_count: inventory.out_of_stock.length,
    low_stock_threshold: lowStockNum,
  };

  res.status(200).json({
    status: 'success',
    summary,
    data: status ? mapped : inventory,
  });
};

export const getProductInventory = async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id).populate('category', 'name').lean<InventoryProductShape>();
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }
  const totalSold = product.sold ?? 0;
  const currentStock = product.quantity;
  const totalStock = currentStock + totalSold;
  let inventoryStatus: string;
  if (currentStock === 0) inventoryStatus = 'out_of_stock';
  else if (currentStock <= 10) inventoryStatus = 'low_stock';
  else inventoryStatus = 'in_stock';

  res.status(200).json({
    status: 'success',
    data: {
      product: {
        id: product._id,
        title: product.title,
        slug: product.slug,
        category: product.category,
        price: product.price,
      },
      inventory: {
        current_stock: currentStock,
        total_sold: totalSold,
        total_stock: totalStock,
        availability_percentage:
          totalStock > 0 ? Math.round((currentStock / totalStock) * 100) : 0,
        inventory_status: inventoryStatus,
        is_available: currentStock > 0,
      },
    },
  });
};

export const updateProductStock = async (req: Request, res: Response, next: NextFunction) => {
  const { quantity, operation = 'set' } = req.body as { quantity: number; operation?: 'set' | 'add' | 'subtract' };
  if (typeof quantity !== 'number' || quantity < 0) {
    return next(new ApiError('Quantity must be a non-negative number', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }
  let newQuantity: number;
  switch (operation) {
    case 'set':
      newQuantity = quantity;
      break;
    case 'add':
      newQuantity = product.quantity + quantity;
      break;
    case 'subtract':
      newQuantity = product.quantity - quantity;
      if (newQuantity < 0) {
        return next(new ApiError('Insufficient stock for subtraction', 400));
      }
      break;
    default:
      return next(new ApiError('Invalid operation. Use "set", "add", or "subtract"', 400));
  }
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { quantity: newQuantity },
    { new: true, runValidators: true }
  ).populate('category', 'name');

  res.status(200).json({
    status: 'success',
    message: 'Stock updated successfully',
    data: {
      product: updatedProduct?.title,
      previous_stock: product.quantity,
      new_stock: newQuantity,
      operation,
      change_amount: operation === 'set' ? 'N/A' : quantity,
    },
  });
};

export const bulkUpdateStock = async (req: Request, res: Response, next: NextFunction) => {
  const { updates } = req.body as {
    updates: Array<{ productId: string; quantity: number; operation?: string }>;
  };
  if (!Array.isArray(updates) || updates.length === 0) {
    return next(new ApiError('Updates array is required and cannot be empty', 400));
  }
  const results: Array<Record<string, unknown>> = [];
  const errors: Array<Record<string, unknown>> = [];

  for (const update of updates) {
    try {
      const { productId, quantity, operation = 'set' } = update;
      if (!productId || typeof quantity !== 'number' || quantity < 0) {
        errors.push({ productId, error: 'Invalid productId or quantity' });
        continue;
      }
      const product = await Product.findById(productId);
      if (!product) {
        errors.push({ productId, error: 'Product not found' });
        continue;
      }
      let newQuantity: number;
      switch (operation) {
        case 'set':
          newQuantity = quantity;
          break;
        case 'add':
          newQuantity = product.quantity + quantity;
          break;
        case 'subtract':
          newQuantity = product.quantity - quantity;
          if (newQuantity < 0) {
            errors.push({ productId, error: 'Insufficient stock for subtraction' });
            continue;
          }
          break;
        default:
          errors.push({ productId, error: 'Invalid operation' });
          continue;
      }
      await Product.findByIdAndUpdate(productId, { quantity: newQuantity });
      results.push({
        productId,
        title: product.title,
        previous_stock: product.quantity,
        new_stock: newQuantity,
        operation,
        success: true,
      });
    } catch (error) {
      errors.push({
        productId: update.productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Bulk update completed. ${results.length} successful, ${errors.length} failed.`,
    data: {
      successful_updates: results,
      failed_updates: errors,
      summary: {
        total_updates: updates.length,
        successful: results.length,
        failed: errors.length,
      },
    },
  });
};

export const getLowStockAlerts = async (req: Request, res: Response) => {
  const { threshold = '10' } = req.query as { threshold?: string };
  const t = Number(threshold) || 10;

  const lowStockProducts = await Product.find({
    quantity: { $lte: t, $gt: 0 },
  })
    .populate('category', 'name')
    .select('title slug quantity sold price category')
    .sort({ quantity: 1 })
    .lean<InventoryProductShape[]>();

  const outOfStockProducts = await Product.find({ quantity: 0 })
    .populate('category', 'name')
    .select('title slug quantity sold price category')
    .lean<InventoryProductShape[]>();

  const alerts = {
    low_stock: lowStockProducts.map((product) => toInventoryAlertProduct(product, t)),
    out_of_stock: outOfStockProducts.map((product) => toInventoryAlertProduct(product, t)),
  };

  const summary = {
    low_stock_count: lowStockProducts.length,
    out_of_stock_count: outOfStockProducts.length,
    total_alerts: lowStockProducts.length + outOfStockProducts.length,
    threshold: t,
  };

  res.status(200).json({ status: 'success', summary, data: alerts });
};
