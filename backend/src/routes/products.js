import express from 'express';
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getRelatedProducts,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import { requireDB } from '../middleware/dbCheck.js';

const router = express.Router();

router.get('/', requireDB, getAllProducts);
router.get('/search', searchLimiter, requireDB, searchProducts);
router.get('/:slug', requireDB, getProductBySlug);
router.get('/:id/related', requireDB, getRelatedProducts);

// Admin routes
router.post('/', protect, authorize('admin', 'super-admin'), requireDB, createProduct);
router.put('/:id', protect, authorize('admin', 'super-admin'), requireDB, updateProduct);
router.delete('/:id', protect, authorize('admin', 'super-admin'), requireDB, deleteProduct);

export default router;
