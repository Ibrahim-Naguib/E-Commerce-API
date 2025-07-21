const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Product = require('../models/productModel');

// @desc Get inventory status for all products
// @route GET /api/v1/inventory
// @access Private/Admin
const getInventoryStatus = asyncHandler(async (req, res, next) => {
  // Parse query parameters for filtering
  const { lowStock = 10, category, status } = req.query;

  let filter = {};

  // Filter by category if provided (categories have functional meaning)
  if (category) {
    filter.category = category;
  }

  // Get all products with inventory information
  let products = await Product.find(filter)
    .populate('category', 'name')
    .select('title slug quantity sold price category');

  // Add inventory status to each product
  products = products.map((product) => {
    const productObj = product.toObject();

    // Calculate inventory status
    if (productObj.quantity === 0) {
      productObj.inventoryStatus = 'out_of_stock';
    } else if (productObj.quantity <= lowStock) {
      productObj.inventoryStatus = 'low_stock';
    } else {
      productObj.inventoryStatus = 'in_stock';
    }

    // Calculate availability percentage
    const totalSold = productObj.sold || 0;
    const totalStock = productObj.quantity + totalSold;
    productObj.availabilityPercentage =
      totalStock > 0 ? Math.round((productObj.quantity / totalStock) * 100) : 0;

    return productObj;
  });

  // Filter by status if provided
  if (status) {
    products = products.filter((product) => product.inventoryStatus === status);
  }

  // Group products by inventory status
  const inventory = {
    in_stock: products.filter((p) => p.inventoryStatus === 'in_stock'),
    low_stock: products.filter((p) => p.inventoryStatus === 'low_stock'),
    out_of_stock: products.filter((p) => p.inventoryStatus === 'out_of_stock'),
  };

  const summary = {
    total_products: products.length,
    in_stock_count: inventory.in_stock.length,
    low_stock_count: inventory.low_stock.length,
    out_of_stock_count: inventory.out_of_stock.length,
    low_stock_threshold: parseInt(lowStock),
  };

  res.status(200).json({
    status: 'success',
    summary,
    data: status ? products : inventory,
  });
});

// @desc Get inventory for a specific product
// @route GET /api/v1/inventory/product/:id
// @access Private/Admin
const getProductInventory = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate(
    'category',
    'name'
  );

  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Calculate inventory details
  const totalSold = product.sold || 0;
  const currentStock = product.quantity;
  const totalStock = currentStock + totalSold;

  let inventoryStatus;
  if (currentStock === 0) {
    inventoryStatus = 'out_of_stock';
  } else if (currentStock <= 10) {
    inventoryStatus = 'low_stock';
  } else {
    inventoryStatus = 'in_stock';
  }

  const inventoryData = {
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
  };

  res.status(200).json({
    status: 'success',
    data: inventoryData,
  });
});

// @desc Update product stock
// @route PUT /api/v1/inventory/product/:id/stock
// @access Private/Admin
const updateProductStock = asyncHandler(async (req, res, next) => {
  const { quantity, operation = 'set' } = req.body;

  if (typeof quantity !== 'number' || quantity < 0) {
    return next(new ApiError('Quantity must be a non-negative number', 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  let newQuantity;

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
      return next(
        new ApiError('Invalid operation. Use "set", "add", or "subtract"', 400)
      );
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { quantity: newQuantity },
    { new: true, runValidators: true }
  ).populate('category', 'name');

  // Log stock movement (you can enhance this to store in a separate collection)
  console.log(
    `Stock updated for product ${product.title}: ${product.quantity} → ${newQuantity} (Operation: ${operation})`
  );

  res.status(200).json({
    status: 'success',
    message: `Stock updated successfully`,
    data: {
      product: updatedProduct.title,
      previous_stock: product.quantity,
      new_stock: newQuantity,
      operation: operation,
      change_amount: operation === 'set' ? 'N/A' : quantity,
    },
  });
});

// @desc Bulk update stock for multiple products
// @route PUT /api/v1/inventory/bulk-update
// @access Private/Admin
const bulkUpdateStock = asyncHandler(async (req, res, next) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return next(
      new ApiError('Updates array is required and cannot be empty', 400)
    );
  }

  const results = [];
  const errors = [];

  for (const update of updates) {
    try {
      const { productId, quantity, operation = 'set' } = update;

      if (!productId || typeof quantity !== 'number' || quantity < 0) {
        errors.push({
          productId,
          error: 'Invalid productId or quantity',
        });
        continue;
      }

      const product = await Product.findById(productId);

      if (!product) {
        errors.push({
          productId,
          error: 'Product not found',
        });
        continue;
      }

      let newQuantity;

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
            errors.push({
              productId,
              error: 'Insufficient stock for subtraction',
            });
            continue;
          }
          break;
        default:
          errors.push({
            productId,
            error: 'Invalid operation',
          });
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
        error: error.message,
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
});

// @desc Get low stock alerts
// @route GET /api/v1/inventory/alerts
// @access Private/Admin
const getLowStockAlerts = asyncHandler(async (req, res, next) => {
  const { threshold = 10 } = req.query;

  const lowStockProducts = await Product.find({
    quantity: { $lte: parseInt(threshold), $gt: 0 },
  })
    .populate('category', 'name')
    .select('title slug quantity sold price category')
    .sort({ quantity: 1 });

  const outOfStockProducts = await Product.find({
    quantity: 0,
  })
    .populate('category', 'name')
    .select('title slug quantity sold price category');

  const alerts = {
    low_stock: lowStockProducts.map((product) => ({
      ...product.toObject(),
      alert_type: 'low_stock',
      alert_message: `Only ${product.quantity} items left in stock`,
    })),
    out_of_stock: outOfStockProducts.map((product) => ({
      ...product.toObject(),
      alert_type: 'out_of_stock',
      alert_message: 'Product is out of stock',
    })),
  };

  const summary = {
    low_stock_count: lowStockProducts.length,
    out_of_stock_count: outOfStockProducts.length,
    total_alerts: lowStockProducts.length + outOfStockProducts.length,
    threshold: parseInt(threshold),
  };

  res.status(200).json({
    status: 'success',
    summary,
    data: alerts,
  });
});

// @desc Reserve stock for order (internal function)
// This function should be called when an order is being processed
const reserveStock = asyncHandler(async (cartItems) => {
  const stockUpdates = [];
  const errors = [];

  for (const item of cartItems) {
    try {
      const product = await Product.findById(item.product);

      if (!product) {
        errors.push({
          productId: item.product,
          error: 'Product not found',
        });
        continue;
      }

      if (product.quantity < item.quantity) {
        errors.push({
          productId: item.product,
          productName: product.title,
          error: `Insufficient stock. Available: ${product.quantity}, Requested: ${item.quantity}`,
          available: product.quantity,
          requested: item.quantity,
        });
        continue;
      }

      // Reserve stock by decreasing quantity and increasing sold
      const newQuantity = product.quantity - item.quantity;
      const newSold = (product.sold || 0) + item.quantity;

      await Product.findByIdAndUpdate(item.product, {
        quantity: newQuantity,
        sold: newSold,
      });

      stockUpdates.push({
        productId: item.product,
        productName: product.title,
        quantity_reserved: item.quantity,
        remaining_stock: newQuantity,
        total_sold: newSold,
      });
    } catch (error) {
      errors.push({
        productId: item.product,
        error: error.message,
      });
    }
  }

  return { stockUpdates, errors };
});

module.exports = {
  getInventoryStatus,
  getProductInventory,
  updateProductStock,
  bulkUpdateStock,
  getLowStockAlerts,
  reserveStock,
};
