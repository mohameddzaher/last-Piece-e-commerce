
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiSearch,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiEye,
  FiEdit2,
  FiDollarSign,
  FiStar,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { adminAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';
import { FiDownload } from 'react-icons/fi';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusIcons = {
  pending: FiClock,
  processing: FiPackage,
  shipped: FiTruck,
  delivered: FiCheckCircle,
  cancelled: FiXCircle,
};

export default function AdminOrders() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusModal, setStatusModal] = useState({ open: false, order: null });
  const [newStatus, setNewStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (user?.role !== 'super-admin') {
      toast.error('Only Super Admin can export data');
      return;
    }
    try {
      setExporting(true);
      const response = await adminAPI.exportOrders();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    } finally {
      setExporting(false);
    }
  };

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

    fetchOrders();
  }, [isAuthenticated, user, router, statusFilter]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminAPI.getOrders({ page, limit: 10, search, status: statusFilter });
      if (res.data.success) {
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, currentPage: 1 });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handleUpdateStatus = async () => {
    if (!statusModal.order || !newStatus) return;

    try {
      const res = await adminAPI.updateOrderStatus(statusModal.order._id, newStatus);
      if (res.data.success) {
        toast.success('Order status updated');
        fetchOrders(pagination.currentPage);
      }
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setStatusModal({ open: false, order: null });
      setNewStatus('');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome, current: false },
    { name: 'Products', href: '/admin/products', icon: FiPackage, current: false },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag, current: true },
    { name: 'Users', href: '/admin/users', icon: FiUsers, current: false },
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: false },
    ...(user?.role === 'super-admin' ? [{ name: 'Financial', href: '/admin/financial', icon: FiDollarSign, current: false }] : []),
    { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: false },
  ];

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

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
                <h1 className='text-xl font-bold text-white'>Orders</h1>
                <p className='text-sm text-gray-400'>Manage customer orders</p>
              </div>
            </div>
            {user?.role === 'super-admin' && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-xl font-medium transition-colors'
              >
                {exporting ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <FiDownload size={18} />
                )}
                <span className='hidden sm:inline'>Export</span>
              </button>
            )}
          </div>
        </header>

        {/* Orders Content */}
        <main className='p-4 lg:p-8'>
          {/* Search and Filters */}
          <div className='flex flex-col sm:flex-row gap-4 mb-6'>
            <form onSubmit={handleSearch} className='flex-1 relative'>
              <FiSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search by order number...'
                className='w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </form>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Pills */}
          <div className='flex flex-wrap gap-2 mb-6'>
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !statusFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {statuses.map((status) => {
              const Icon = statusIcons[status];
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? statusColors[status]
                      : 'bg-slate-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Orders Table */}
          <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
            {loading ? (
              <div className='flex items-center justify-center py-20'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-slate-800'>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Order</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Customer</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Date</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Total</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Status</th>
                        <th className='text-right px-6 py-4 text-gray-400 font-medium'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const StatusIcon = statusIcons[order.status] || FiClock;
                        return (
                          <tr key={order._id} className='border-b border-slate-800/50 hover:bg-slate-800/30'>
                            <td className='px-6 py-4'>
                              <p className='text-white font-medium'>
                                #{order.orderNumber || order._id.slice(-8)}
                              </p>
                              <p className='text-gray-500 text-sm'>
                                {order.items?.length || 0} items
                              </p>
                            </td>
                            <td className='px-6 py-4'>
                              <p className='text-white'>
                                {order.userId?.firstName} {order.userId?.lastName}
                              </p>
                              <p className='text-gray-500 text-sm'>{order.userId?.email}</p>
                            </td>
                            <td className='px-6 py-4'>
                              <p className='text-white'>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                              <p className='text-gray-500 text-sm'>
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </p>
                            </td>
                            <td className='px-6 py-4'>
                              <p className='text-white font-medium'>
                                ${order.pricing?.total?.toFixed(2)}
                              </p>
                            </td>
                            <td className='px-6 py-4'>
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${
                                  statusColors[order.status]
                                }`}
                              >
                                <StatusIcon size={14} />
                                {order.status}
                              </span>
                            </td>
                            <td className='px-6 py-4'>
                              <div className='flex items-center justify-end gap-2'>
                                <Link
                                  href={`/admin/orders/${order._id}`}
                                  className='p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors'
                                  title='View'
                                >
                                  <FiEye size={18} />
                                </Link>
                                <button
                                  onClick={() => {
                                    setStatusModal({ open: true, order });
                                    setNewStatus(order.status);
                                  }}
                                  className='p-2 text-gray-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors'
                                  title='Update Status'
                                >
                                  <FiEdit2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className='flex items-center justify-between px-6 py-4 border-t border-slate-800'>
                    <p className='text-gray-400 text-sm'>
                      Showing {(pagination.currentPage - 1) * 10 + 1} to{' '}
                      {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} orders
                    </p>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => fetchOrders(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className='p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === pagination.pages ||
                            Math.abs(page - pagination.currentPage) <= 1
                        )
                        .map((page, idx, arr) => (
                          <span key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className='text-gray-600 px-2'>...</span>
                            )}
                            <button
                              onClick={() => fetchOrders(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                page === pagination.currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              {page}
                            </button>
                          </span>
                        ))}
                      <button
                        onClick={() => fetchOrders(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.pages}
                        className='p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <FiChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className='text-center py-20'>
                <FiShoppingBag className='mx-auto text-gray-600 mb-4' size={48} />
                <h3 className='text-xl font-bold text-white mb-2'>No orders found</h3>
                <p className='text-gray-400'>
                  {search || statusFilter ? 'Try different filters' : 'Orders will appear here'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Update Status Modal */}
      <AnimatePresence>
        {statusModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={() => setStatusModal({ open: false, order: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className='text-xl font-bold text-white mb-2'>Update Order Status</h3>
              <p className='text-gray-400 mb-6'>
                Order #{statusModal.order?.orderNumber || statusModal.order?._id.slice(-8)}
              </p>

              <div className='space-y-3 mb-6'>
                {statuses.map((status) => {
                  const Icon = statusIcons[status];
                  return (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all ${
                        newStatus === status
                          ? statusColors[status]
                          : 'border-slate-700 text-gray-400 hover:border-slate-600'
                      }`}
                    >
                      <Icon size={18} />
                      <span className='capitalize'>{status}</span>
                    </button>
                  );
                })}
              </div>

              <div className='flex gap-4'>
                <button
                  onClick={() => setStatusModal({ open: false, order: null })}
                  className='flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className='flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
