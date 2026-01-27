import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  blockUser,
  deleteUser,
  getAdminOrders,
  getAdminOrderById,
  getDashboardStats,
  getSuperAdminStats,
  exportProducts,
  exportUsers,
  exportOrders,
  getFinancialReport,
  getSystemSettings,
  updateSystemSettings,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all admin routes
router.use(protect, authorize('admin', 'super-admin'));

// Dashboard - available to both admin and super-admin
router.get('/dashboard/stats', getDashboardStats);

// Users - basic view for admin, full control for super-admin
router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', authorize('super-admin'), updateUser);
router.put('/users/:userId/role', authorize('super-admin'), updateUserRole);
router.put('/users/:userId/block', authorize('super-admin'), blockUser);
router.delete('/users/:userId', authorize('super-admin'), deleteUser);

// Orders - view for both, financial details for super-admin
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);

// Super Admin Only Routes
router.get('/super/stats', authorize('super-admin'), getSuperAdminStats);
router.get('/super/financial-report', authorize('super-admin'), getFinancialReport);
router.get('/super/settings', authorize('super-admin'), getSystemSettings);
router.put('/super/settings', authorize('super-admin'), updateSystemSettings);

// Export Routes - Super Admin Only
router.get('/export/products', authorize('super-admin'), exportProducts);
router.get('/export/users', authorize('super-admin'), exportUsers);
router.get('/export/orders', authorize('super-admin'), exportOrders);

export default router;
