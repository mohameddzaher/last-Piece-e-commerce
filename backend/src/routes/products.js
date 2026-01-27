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

const router = express.Router();

router.get('/', getAllProducts);
router.get('/search', searchLimiter, searchProducts);
router.get('/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);

// Admin routes
router.post('/', protect, authorize('admin', 'super-admin'), createProduct);
router.put('/:id', protect, authorize('admin', 'super-admin'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'super-admin'), deleteProduct);

export default router;
