export type InventoryProductShape = {
  _id: unknown;
  title: string;
  slug: string;
  quantity: number;
  sold?: number | null;
  price?: number;
  category?: unknown;
};

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type InventoryProductView = Omit<InventoryProductShape, 'sold'> & {
  sold: number;
  inventoryStatus: InventoryStatus;
  availabilityPercentage: number;
};

function resolveInventoryStatus(quantity: number, lowStockThreshold: number): InventoryStatus {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export function toInventoryProductView(
  product: InventoryProductShape,
  lowStockThreshold: number
): InventoryProductView {
  const sold = product.sold ?? 0;
  const totalStock = product.quantity + sold;
  return {
    ...product,
    sold,
    inventoryStatus: resolveInventoryStatus(product.quantity, lowStockThreshold),
    availabilityPercentage: totalStock > 0 ? Math.round((product.quantity / totalStock) * 100) : 0,
  };
}

export function toInventoryAlertProduct(
  product: InventoryProductShape,
  lowStockThreshold: number
): InventoryProductView & { alert_type: 'low_stock' | 'out_of_stock'; alert_message: string } {
  const view = toInventoryProductView(product, lowStockThreshold);
  return {
    ...view,
    alert_type: view.inventoryStatus === 'out_of_stock' ? 'out_of_stock' : 'low_stock',
    alert_message:
      view.inventoryStatus === 'out_of_stock'
        ? 'Product is out of stock'
        : `Only ${view.quantity} items left in stock`,
  };
}