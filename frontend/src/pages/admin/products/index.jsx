
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiMoreVertical,
  FiDollarSign,
  FiStar,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { productAPI, adminAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';
import { FiDownload } from 'react-icons/fi';

export default function AdminProducts() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (user?.role !== 'super-admin') {
      toast.error('Only Super Admin can export data');
      return;
    }
    try {
      setExporting(true);
      const response = await adminAPI.exportProducts();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
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

    fetchProducts();
  }, [isAuthenticated, user, router]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await productAPI.getAll({ page, limit: 10, search });
      if (res.data.success) {
        setProducts(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, currentPage: 1 });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;

    try {
      const res = await productAPI.delete(deleteModal.product._id);
      if (res.data.success) {
        toast.success('Product deleted successfully');
        fetchProducts(pagination.currentPage);
      }
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeleteModal({ open: false, product: null });
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome, current: false },
    { name: 'Products', href: '/admin/products', icon: FiPackage, current: true },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag, current: false },
    { name: 'Users', href: '/admin/users', icon: FiUsers, current: false },
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: false },
    ...(user?.role === 'super-admin' ? [{ name: 'Financial', href: '/admin/financial', icon: FiDollarSign, current: false }] : []),
    { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: false },
  ];

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
                <h1 className='text-xl font-bold text-white'>Products</h1>
                <p className='text-sm text-gray-400'>Manage your product inventory</p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
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
              <Link
                href='/admin/products/new'
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
              >
                <FiPlus size={18} />
                <span className='hidden sm:inline'>Add Product</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Products Content */}
        <main className='p-4 lg:p-8'>
          {/* Search and Filters */}
          <div className='flex flex-col sm:flex-row gap-4 mb-6'>
            <form onSubmit={handleSearch} className='flex-1 relative'>
              <FiSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search products...'
                className='w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </form>
            <button className='flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-gray-400 hover:text-white transition-colors'>
              <FiFilter size={18} />
              <span>Filters</span>
            </button>
          </div>

          {/* Products Table */}
          <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
            {loading ? (
              <div className='flex items-center justify-center py-20'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-slate-800'>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Product</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Category</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Price</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Stock</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Status</th>
                        <th className='text-right px-6 py-4 text-gray-400 font-medium'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id} className='border-b border-slate-800/50 hover:bg-slate-800/30'>
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-4'>
                              <div className='w-12 h-12 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0'>
                                {product.thumbnail || product.images?.[0]?.url ? (
                                  <img
                                    src={product.thumbnail || product.images[0].url}
                                    alt={product.name}
                                    className='w-full h-full object-cover'
                                  />
                                ) : (
                                  <div className='w-full h-full flex items-center justify-center'>
                                    <FiPackage className='text-gray-600' size={20} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className='text-white font-medium'>{product.name}</p>
                                <p className='text-gray-500 text-sm'>{product.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <span className='px-3 py-1 bg-slate-800 rounded-lg text-gray-300 text-sm'>
                              {product.category?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className='px-6 py-4'>
                            <p className='text-white font-medium'>${product.price?.toFixed(2)}</p>
                            {product.comparePrice && (
                              <p className='text-gray-500 text-sm line-through'>
                                ${product.comparePrice?.toFixed(2)}
                              </p>
                            )}
                          </td>
                          <td className='px-6 py-4'>
                            <span
                              className={`px-3 py-1 rounded-lg text-sm ${
                                product.stock > 0
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td className='px-6 py-4'>
                            <span
                              className={`px-3 py-1 rounded-lg text-sm ${
                                product.status === 'active'
                                  ? 'bg-green-500/10 text-green-400'
                                  : product.status === 'draft'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center justify-end gap-2'>
                              <Link
                                href={`/products/${product.slug}`}
                                className='p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors'
                                title='View'
                              >
                                <FiEye size={18} />
                              </Link>
                              <Link
                                href={`/admin/products/${product._id}`}
                                className='p-2 text-gray-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors'
                                title='Edit'
                              >
                                <FiEdit2 size={18} />
                              </Link>
                              <button
                                onClick={() => setDeleteModal({ open: true, product })}
                                className='p-2 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors'
                                title='Delete'
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className='flex items-center justify-between px-6 py-4 border-t border-slate-800'>
                    <p className='text-gray-400 text-sm'>
                      Showing {(pagination.currentPage - 1) * 10 + 1} to{' '}
                      {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} products
                    </p>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => fetchProducts(pagination.currentPage - 1)}
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
                              onClick={() => fetchProducts(page)}
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
                        onClick={() => fetchProducts(pagination.currentPage + 1)}
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
                <FiPackage className='mx-auto text-gray-600 mb-4' size={48} />
                <h3 className='text-xl font-bold text-white mb-2'>No products found</h3>
                <p className='text-gray-400 mb-6'>
                  {search ? 'Try different search terms' : 'Start by adding your first product'}
                </p>
                <Link
                  href='/admin/products/new'
                  className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
                >
                  <FiPlus size={18} />
                  Add Product
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={() => setDeleteModal({ open: false, product: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='text-center'>
                <div className='w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <FiTrash2 className='text-red-400' size={32} />
                </div>
                <h3 className='text-xl font-bold text-white mb-2'>Delete Product</h3>
                <p className='text-gray-400 mb-6'>
                  Are you sure you want to delete "{deleteModal.product?.name}"? This action cannot be undone.
                </p>
                <div className='flex gap-4'>
                  <button
                    onClick={() => setDeleteModal({ open: false, product: null })}
                    className='flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className='flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
