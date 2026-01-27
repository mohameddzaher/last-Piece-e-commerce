import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { calculatePagination } from '../utils/helpers.js';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';

// Users Management
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const { skip, limit: pageLimit } = calculatePagination(page, limit);

    let filter = {};
    if (search) filter.$or = [{ firstName: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .skip(skip)
      .limit(pageLimit)
      .select('-password -emailVerificationToken -passwordResetToken');

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        pages: Math.ceil(total / pageLimit),
        currentPage: parseInt(page),
        pageSize: pageLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, password, phone, role, status } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update basic fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Return user without sensitive data
    const updatedUser = await User.findById(userId).select('-password -emailVerificationToken -passwordResetToken');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(userId, { status: 'blocked' }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User blocked',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Orders Management
export const getAdminOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const { skip, limit: pageLimit } = calculatePagination(page, limit);

    let filter = {};
    if (status) filter.status = status;
    if (search) filter.orderNumber = new RegExp(search, 'i');

    const orders = await Order.find(filter)
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(pageLimit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        pages: Math.ceil(total / pageLimit),
        currentPage: parseInt(page),
        pageSize: pageLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate('userId items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard Analytics
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments({ status: { $in: ['active', 'draft'] } });

    // Calculate revenue from delivered/completed orders OR orders with completed payment
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          $or: [
            { status: { $in: ['delivered', 'completed'] } },
            { 'payment.status': 'completed' }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]);

    const recentOrders = await Order.find()
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        recentOrders,
        ordersByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete User - Super Admin Only
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting super-admin accounts
    if (user.role === 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super-admin accounts',
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Super Admin Stats - Extended statistics
export const getSuperAdminStats = async (req, res, next) => {
  try {
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    // User breakdown by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // User breakdown by status
    const usersByStatus = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue calculations
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          $or: [
            { status: { $in: ['delivered', 'completed'] } },
            { 'payment.status': 'completed' }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]);

    // Pending revenue (orders in processing/shipped)
    const pendingRevenue = await Order.aggregate([
      { $match: { status: { $in: ['processing', 'shipped', 'confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]);

    // Monthly revenue for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          $or: [
            { status: { $in: ['delivered', 'completed'] } },
            { 'payment.status': 'completed' }
          ]
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Product statistics
    const productsByStatus = await Product.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      'sizes.stock': { $lte: 5 },
      status: 'active'
    });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // New orders this month
    const newOrdersThisMonth = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingRevenue: pendingRevenue[0]?.total || 0,
          newUsersThisMonth,
          newOrdersThisMonth,
          lowStockProducts,
        },
        usersByRole,
        usersByStatus,
        ordersByStatus,
        productsByStatus,
        monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Financial Report - Super Admin Only
export const getFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Total revenue
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          $or: [
            { status: { $in: ['delivered', 'completed'] } },
            { 'payment.status': 'completed' }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' },
          subtotal: { $sum: '$pricing.subtotal' },
          shipping: { $sum: '$pricing.shipping' },
          discount: { $sum: '$pricing.discount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue by payment method
    const revenueByPaymentMethod = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          $or: [
            { status: { $in: ['delivered', 'completed'] } },
            { 'payment.status': 'completed' }
          ]
        }
      },
      {
        $group: {
          _id: '$payment.method',
          total: { $sum: '$pricing.total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily revenue for chart (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          $or: [
            { status: { $in: ['delivered', 'completed'] } },
            { 'payment.status': 'completed' }
          ]
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ]);

    // Cancelled orders loss
    const cancelledOrders = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'cancelled'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenue[0]?.total || 0,
          subtotal: totalRevenue[0]?.subtotal || 0,
          totalShipping: totalRevenue[0]?.shipping || 0,
          totalDiscount: totalRevenue[0]?.discount || 0,
          completedOrders: totalRevenue[0]?.count || 0,
          cancelledLoss: cancelledOrders[0]?.total || 0,
          cancelledCount: cancelledOrders[0]?.count || 0,
        },
        revenueByPaymentMethod,
        dailyRevenue,
        topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export Products to Excel
export const exportProducts = async (req, res, next) => {
  try {
    const products = await Product.find().lean();

    const data = products.map(p => ({
      'ID': p._id.toString(),
      'Name': p.name,
      'SKU': p.sku || '',
      'Brand': p.brand || '',
      'Category': p.category || '',
      'Price': p.price,
      'Sale Price': p.salePrice || '',
      'Status': p.status,
      'Total Stock': p.sizes?.reduce((acc, s) => acc + (s.stock || 0), 0) || 0,
      'Sizes': p.sizes?.map(s => `${s.size}(${s.stock})`).join(', ') || '',
      'Colors': p.colors?.join(', ') || '',
      'Created At': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Export Users to Excel
export const exportUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -emailVerificationToken -passwordResetToken').lean();

    const data = users.map(u => ({
      'ID': u._id.toString(),
      'First Name': u.firstName,
      'Last Name': u.lastName,
      'Email': u.email,
      'Phone': u.phone || '',
      'Role': u.role,
      'Status': u.status,
      'Email Verified': u.emailVerified ? 'Yes' : 'No',
      'Created At': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '',
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Export Orders to Excel
export const exportOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'firstName lastName email')
      .lean();

    const data = orders.map(o => ({
      'Order Number': o.orderNumber,
      'Customer Name': o.userId ? `${o.userId.firstName} ${o.userId.lastName}` : 'Guest',
      'Customer Email': o.userId?.email || o.shippingAddress?.email || '',
      'Status': o.status,
      'Payment Method': o.payment?.method || '',
      'Payment Status': o.payment?.status || '',
      'Subtotal': o.pricing?.subtotal || 0,
      'Shipping': o.pricing?.shipping || 0,
      'Discount': o.pricing?.discount || 0,
      'Total': o.pricing?.total || 0,
      'Items Count': o.items?.length || 0,
      'Shipping Address': o.shippingAddress ?
        `${o.shippingAddress.street}, ${o.shippingAddress.city}, ${o.shippingAddress.state} ${o.shippingAddress.zipCode}` : '',
      'Created At': o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Get System Settings - Super Admin Only
export const getSystemSettings = async (req, res, next) => {
  try {
    const settings = {
      siteName: 'Last Piece',
      currency: 'USD',
      taxRate: 0,
      freeShippingThreshold: 100,
      defaultShippingCost: 10,
      allowGuestCheckout: true,
      requireEmailVerification: true,
      maxOrderItems: 10,
    };

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// Update System Settings - Super Admin Only
export const updateSystemSettings = async (req, res, next) => {
  try {
    const settings = req.body;

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};