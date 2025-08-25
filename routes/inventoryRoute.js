const express = require('express');
const {
  getInventoryStatus,
  getProductInventory,
  updateProductStock,
  bulkUpdateStock,
  getLowStockAlerts,
} = require('../controllers/inventoryController');
const authController = require('../controllers/authController');
const {
  updateProductStockValidator,
  bulkUpdateStockValidator,
} = require('../utils/validators/inventoryValidator');

const router = express.Router();

// All inventory routes require authentication
router.use(authController.protect);

// Restrict to admin and manager only
router.use(authController.allowedTo('admin', 'manager'));

// Inventory status and alerts
router.get('/', getInventoryStatus);
router.get('/alerts', getLowStockAlerts);

// Product-specific inventory
router.get('/product/:id', getProductInventory);
router.put(
  '/product/:id/stock',
  updateProductStockValidator,
  updateProductStock
);

// Bulk operations
router.put('/bulk-update', bulkUpdateStockValidator, bulkUpdateStock);

module.exports = router;
