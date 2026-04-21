import express from 'express';
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getRelatedProducts,
  bulkUpdateLocation,
  getInventoryByLocation,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public reads — optionalAuth populates req.user when a token is sent so the
// controller can apply role-based field filtering & location scoping.
router.get('/', optionalAuth, getAllProducts);
router.get('/search', searchLimiter, optionalAuth, searchProducts);

// Inventory bucket views — staff/admin only.
router.get(
  '/inventory/:bucket',
  protect,
  authorize('admin', 'super-admin', 'saudi-staff', 'egypt-staff'),
  getInventoryByLocation,
);

// Bulk send-to-location action — super-admin only (sets prices).
router.post(
  '/bulk/location',
  protect,
  authorize('super-admin'),
  bulkUpdateLocation,
);

router.get('/:slug', optionalAuth, getProductBySlug);
router.get('/:id/related', optionalAuth, getRelatedProducts);

// Saudi staff can also create products (purchasing flow).
router.post(
  '/',
  protect,
  authorize('admin', 'super-admin', 'saudi-staff'),
  createProduct,
);
router.put(
  '/:id',
  protect,
  authorize('admin', 'super-admin', 'saudi-staff', 'egypt-staff'),
  updateProduct,
);
router.delete('/:id', protect, authorize('admin', 'super-admin'), deleteProduct);

export default router;
