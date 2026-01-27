
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiPlus,
  FiDownload,
  FiStar,
  FiBarChart2,
  FiPieChart,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { adminAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-blue-500/10 text-blue-500',
  shipped: 'bg-purple-500/10 text-purple-500',
  delivered: 'bg-green-500/10 text-green-500',
  cancelled: 'bg-red-500/10 text-red-500',
};

const statusIcons = {
  pending: FiClock,
  processing: FiPackage,
  shipped: FiTruck,
  delivered: FiCheckCircle,
  cancelled: FiXCircle,
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [superAdminStats, setSuperAdminStats] = useState(null);
  const [exporting, setExporting] = useState({
    products: false,
    users: false,
    orders: false,
  });

  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin' && user?.role !== 'super-admin') {
      router.push('/dashboard');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await adminAPI.getStats();
      if (res.data.success) {
        setStats(res.data.data.stats);
        setRecentOrders(res.data.data.recentOrders || []);
        setOrdersByStatus(res.data.data.ordersByStatus || []);
      }

      // Fetch super admin stats if user is super-admin
      if (user?.role === 'super-admin') {
        try {
          const superRes = await adminAPI.getSuperAdminStats();
          if (superRes.data.success) {
            setSuperAdminStats(superRes.data.data);
          }
        } catch (err) {
          console.error('Error fetching super admin stats:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    setExporting(prev => ({ ...prev, [type]: true }));
    try {
      let response;
      let filename;

      switch (type) {
        case 'products':
          response = await adminAPI.exportProducts();
          filename = 'products.xlsx';
          break;
        case 'users':
          response = await adminAPI.exportUsers();
          filename = 'users.xlsx';
          break;
        case 'orders':
          response = await adminAPI.exportOrders();
          filename = 'orders.xlsx';
          break;
        default:
          return;
      }

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      toast.error(`Failed to export ${type}`);
    } finally {
      setExporting(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome, current: true },
    { name: 'Products', href: '/admin/products', icon: FiPackage, current: false },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag, current: false },
    { name: 'Users', href: '/admin/users', icon: FiUsers, current: false },
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: false },
    ...(isSuperAdmin ? [
      { name: 'Financial Report', href: '/admin/financial', icon: FiBarChart2, current: false, superAdminOnly: true },
      { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: false, superAdminOnly: true },
    ] : []),
  ];

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue?.toLocaleString() || 0}`,
      icon: FiDollarSign,
      color: 'from-green-500 to-emerald-600',
      subtext: isSuperAdmin && superAdminStats?.overview?.pendingRevenue
        ? `$${superAdminStats.overview.pendingRevenue.toLocaleString()} pending`
        : null,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders?.toLocaleString() || 0,
      icon: FiShoppingBag,
      color: 'from-blue-500 to-indigo-600',
      subtext: isSuperAdmin && superAdminStats?.overview?.newOrdersThisMonth
        ? `${superAdminStats.overview.newOrdersThisMonth} this month`
        : null,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts?.toLocaleString() || 0,
      icon: FiPackage,
      color: 'from-purple-500 to-pink-600',
      subtext: isSuperAdmin && superAdminStats?.overview?.lowStockProducts
        ? `${superAdminStats.overview.lowStockProducts} low stock`
        : null,
      alertCount: superAdminStats?.overview?.lowStockProducts,
    },
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || 0,
      icon: FiUsers,
      color: 'from-orange-500 to-red-600',
      subtext: isSuperAdmin && superAdminStats?.overview?.newUsersThisMonth
        ? `${superAdminStats.overview.newUsersThisMonth} this month`
        : null,
    },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Logo */}
          <div className='flex items-center justify-between px-6 py-5 border-b border-slate-800'>
            <Link href='/admin' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>L</span>
              </div>
              <span className='text-xl font-bold text-white'>Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className='lg:hidden text-gray-400 hover:text-white'>
              <FiX size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-4 py-6 space-y-1'>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.current
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className='font-medium'>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className='p-4 border-t border-slate-800'>
            <div className='flex items-center gap-3 px-4 py-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-bold'>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className='flex-1'>
                <p className='text-white font-medium text-sm'>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className='text-gray-500 text-xs'>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all mt-2'
            >
              <FiLogOut size={20} />
              <span className='font-medium'>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className='lg:pl-64'>
        {/* Top Bar */}
        <header className='sticky top-0 z-30 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800'>
          <div className='flex items-center justify-between px-4 lg:px-8 py-4'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => setSidebarOpen(true)}
                className='lg:hidden text-gray-400 hover:text-white'
              >
                <FiMenu size={24} />
              </button>
              <div>
                <h1 className='text-xl font-bold text-white'>Dashboard</h1>
                <p className='text-sm text-gray-400'>Welcome back, {user?.firstName}!</p>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <Link
                href='/admin/products/new'
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
              >
                <FiPlus size={18} />
                <span className='hidden sm:inline'>Add Product</span>
              </Link>
              <Link
                href='/'
                className='text-gray-400 hover:text-white transition-colors'
              >
                <FiEye size={20} />
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className='p-4 lg:p-8'>
          {/* Stats Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className='bg-slate-900 border border-slate-800 rounded-2xl p-6 relative'
                >
                  {stat.alertCount > 0 && (
                    <div className='absolute top-4 right-4'>
                      <span className='flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs'>
                        <FiAlertTriangle size={12} />
                        {stat.alertCount}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center justify-between mb-4'>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <Icon className='text-white' size={24} />
                    </div>
                  </div>
                  <h3 className='text-gray-400 text-sm mb-1'>{stat.title}</h3>
                  <p className='text-2xl font-bold text-white'>{stat.value}</p>
                  {stat.subtext && (
                    <p className='text-xs text-gray-500 mt-1'>{stat.subtext}</p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Recent Orders */}
            <div className='lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-lg font-bold text-white'>Recent Orders</h2>
                <Link
                  href='/admin/orders'
                  className='text-blue-400 hover:text-blue-300 text-sm font-medium'
                >
                  View All
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className='space-y-4'>
                  {recentOrders.map((order) => {
                    const StatusIcon = statusIcons[order.status] || FiClock;
                    return (
                      <div
                        key={order._id}
                        className='flex items-center justify-between p-4 bg-slate-800/50 rounded-xl'
                      >
                        <div className='flex items-center gap-4'>
                          <div className='w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center'>
                            <FiShoppingBag className='text-gray-400' size={18} />
                          </div>
                          <div>
                            <p className='text-white font-medium'>
                              #{order.orderNumber || order._id.slice(-8)}
                            </p>
                            <p className='text-gray-500 text-sm'>
                              {order.userId?.firstName} {order.userId?.lastName}
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-white font-medium'>
                            ${order.pricing?.total?.toFixed(2)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              statusColors[order.status]
                            }`}
                          >
                            <StatusIcon size={12} />
                            {order.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <FiShoppingBag className='mx-auto text-gray-600 mb-3' size={40} />
                  <p className='text-gray-400'>No orders yet</p>
                </div>
              )}
            </div>

            {/* Orders by Status */}
            <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
              <h2 className='text-lg font-bold text-white mb-6'>Orders by Status</h2>

              {ordersByStatus.length > 0 ? (
                <div className='space-y-4'>
                  {ordersByStatus.map((item) => {
                    const StatusIcon = statusIcons[item._id] || FiClock;
                    const totalOrders = ordersByStatus.reduce((sum, o) => sum + o.count, 0);
                    const percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;

                    return (
                      <div key={item._id} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className={`flex items-center gap-2 ${statusColors[item._id]?.replace('bg-', 'text-').split(' ')[1] || 'text-gray-400'}`}>
                            <StatusIcon size={16} />
                            <span className='capitalize'>{item._id}</span>
                          </span>
                          <span className='text-white font-medium'>{item.count}</span>
                        </div>
                        <div className='h-2 bg-slate-800 rounded-full overflow-hidden'>
                          <div
                            className={`h-full rounded-full transition-all ${
                              item._id === 'delivered'
                                ? 'bg-green-500'
                                : item._id === 'cancelled'
                                ? 'bg-red-500'
                                : item._id === 'shipped'
                                ? 'bg-purple-500'
                                : item._id === 'processing'
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <FiTrendingUp className='mx-auto text-gray-600 mb-3' size={40} />
                  <p className='text-gray-400'>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Super Admin Section - Export Data */}
          {isSuperAdmin && (
            <div className='mt-8'>
              <div className='bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center'>
                    <FiDownload className='text-purple-400' size={20} />
                  </div>
                  <div>
                    <h2 className='text-lg font-bold text-white'>Export Data</h2>
                    <p className='text-sm text-gray-400'>Super Admin Only - Download data as Excel files</p>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  <button
                    onClick={() => handleExport('products')}
                    disabled={exporting.products}
                    className='flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-colors disabled:opacity-50'
                  >
                    <FiPackage className='text-purple-400' size={20} />
                    <div className='text-left'>
                      <p className='text-white font-medium'>Products</p>
                      <p className='text-gray-500 text-xs'>Export all products</p>
                    </div>
                    {exporting.products ? (
                      <div className='ml-auto w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <FiDownload className='ml-auto text-gray-500' size={18} />
                    )}
                  </button>

                  <button
                    onClick={() => handleExport('users')}
                    disabled={exporting.users}
                    className='flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:border-green-500/50 transition-colors disabled:opacity-50'
                  >
                    <FiUsers className='text-green-400' size={20} />
                    <div className='text-left'>
                      <p className='text-white font-medium'>Users</p>
                      <p className='text-gray-500 text-xs'>Export all users</p>
                    </div>
                    {exporting.users ? (
                      <div className='ml-auto w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <FiDownload className='ml-auto text-gray-500' size={18} />
                    )}
                  </button>

                  <button
                    onClick={() => handleExport('orders')}
                    disabled={exporting.orders}
                    className='flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-colors disabled:opacity-50'
                  >
                    <FiShoppingBag className='text-blue-400' size={20} />
                    <div className='text-left'>
                      <p className='text-white font-medium'>Orders</p>
                      <p className='text-gray-500 text-xs'>Export all orders</p>
                    </div>
                    {exporting.orders ? (
                      <div className='ml-auto w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <FiDownload className='ml-auto text-gray-500' size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* User & Product Breakdown */}
              {superAdminStats && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
                  {/* Users by Role */}
                  <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                    <h3 className='text-lg font-bold text-white mb-4'>Users by Role</h3>
                    <div className='space-y-3'>
                      {superAdminStats.usersByRole?.map((item) => (
                        <div key={item._id} className='flex items-center justify-between'>
                          <span className='text-gray-400 capitalize'>{item._id || 'User'}</span>
                          <span className='text-white font-medium'>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Products by Status */}
                  <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                    <h3 className='text-lg font-bold text-white mb-4'>Products by Status</h3>
                    <div className='space-y-3'>
                      {superAdminStats.productsByStatus?.map((item) => (
                        <div key={item._id} className='flex items-center justify-between'>
                          <span className={`capitalize ${
                            item._id === 'active' ? 'text-green-400' :
                            item._id === 'draft' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>{item._id}</span>
                          <span className='text-white font-medium'>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className='mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Link
              href='/admin/products/new'
              className='flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-colors group'
            >
              <div className='w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors'>
                <FiPlus className='text-blue-400' size={24} />
              </div>
              <div>
                <p className='text-white font-medium'>Add Product</p>
                <p className='text-gray-500 text-sm'>Create new listing</p>
              </div>
            </Link>

            <Link
              href='/admin/orders'
              className='flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500/50 transition-colors group'
            >
              <div className='w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors'>
                <FiShoppingBag className='text-purple-400' size={24} />
              </div>
              <div>
                <p className='text-white font-medium'>View Orders</p>
                <p className='text-gray-500 text-sm'>Manage all orders</p>
              </div>
            </Link>

            <Link
              href='/admin/users'
              className='flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-green-500/50 transition-colors group'
            >
              <div className='w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors'>
                <FiUsers className='text-green-400' size={24} />
              </div>
              <div>
                <p className='text-white font-medium'>Manage Users</p>
                <p className='text-gray-500 text-sm'>View all users</p>
              </div>
            </Link>

            <Link
              href='/admin/products'
              className='flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-orange-500/50 transition-colors group'
            >
              <div className='w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors'>
                <FiPackage className='text-orange-400' size={24} />
              </div>
              <div>
                <p className='text-white font-medium'>All Products</p>
                <p className='text-gray-500 text-sm'>Manage inventory</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
