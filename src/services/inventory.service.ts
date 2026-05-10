import type { ClientSession, Types } from 'mongoose';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

export type CartLineForStock = {
  product: Types.ObjectId | { _id: Types.ObjectId };
  quantity: number;
};

function productId(line: CartLineForStock): Types.ObjectId {
  const p = line.product;
  return typeof p === 'object' && '_id' in p ? p._id : (p as Types.ObjectId);
}

/** Plain async helper (not Express middleware). Decrements stock atomically per line; not transactional by itself. */
export async function reserveStock(cartItems: CartLineForStock[]) {
  const stockUpdates: Array<Record<string, unknown>> = [];
  const errors: Array<Record<string, unknown>> = [];

  for (const item of cartItems) {
    try {
      const pid = productId(item);
      const product = await Product.findById(pid);
      if (!product) {
        errors.push({ productId: pid, error: 'Product not found' });
        continue;
      }
      if (product.quantity < item.quantity) {
        errors.push({
          productId: pid,
          productName: product.title,
          error: `Insufficient stock. Available: ${product.quantity}, Requested: ${item.quantity}`,
          available: product.quantity,
          requested: item.quantity,
        });
        continue;
      }
      const newQuantity = product.quantity - item.quantity;
      const newSold = (product.sold ?? 0) + item.quantity;
      await Product.findByIdAndUpdate(pid, { quantity: newQuantity, sold: newSold });
      stockUpdates.push({
        productId: pid,
        productName: product.title,
        quantity_reserved: item.quantity,
        remaining_stock: newQuantity,
        total_sold: newSold,
      });
    } catch (error) {
      errors.push({
        productId: productId(item),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  return { stockUpdates, errors };
}

/** Decrements stock inside a transaction using atomic conditional updates. */
export async function decrementStockForLines(
  session: ClientSession,
  lines: Array<{ productId: Types.ObjectId; quantity: number }>
): Promise<void> {
  for (const line of lines) {
    const updated = await Product.findOneAndUpdate(
      { _id: line.productId, quantity: { $gte: line.quantity } },
      { $inc: { quantity: -line.quantity, sold: line.quantity } },
      { session, new: true }
    );
    if (!updated) {
      const product = await Product.findById(line.productId).session(session);
      const available = product?.quantity ?? 0;
      throw new ApiError(
        `Insufficient stock for product ${line.productId.toString()}. Available: ${available}, requested: ${line.quantity}`,
        400
      );
    }
  }
}
