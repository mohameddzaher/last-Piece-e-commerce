
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiStar,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiTrash2,
  FiCheck,
  FiXCircle,
  FiAward,
  FiMessageSquare,
  FiDollarSign,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { reviewAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

export default function AdminReviews() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ open: false, review: null });

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

    fetchReviews();
  }, [isAuthenticated, user, router, statusFilter]);

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await reviewAPI.getAll(params);
      if (res.data.success) {
        setReviews(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, currentPage: 1 });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reviewId, status) => {
    try {
      const res = await reviewAPI.updateStatus(reviewId, status);
      if (res.data.success) {
        toast.success(`Review ${status}`);
        fetchReviews(pagination.currentPage);
      }
    } catch (error) {
      toast.error('Failed to update review status');
    }
  };

  const handleToggleFeatured = async (reviewId) => {
    try {
      const res = await reviewAPI.toggleFeatured(reviewId);
      if (res.data.success) {
        toast.success(res.data.data.isFeatured ? 'Review featured' : 'Review unfeatured');
        fetchReviews(pagination.currentPage);
      }
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.review) return;

    try {
      const res = await reviewAPI.delete(deleteModal.review._id);
      if (res.data.success) {
        toast.success('Review deleted successfully');
        fetchReviews(pagination.currentPage);
      }
    } catch (error) {
      toast.error('Failed to delete review');
    } finally {
      setDeleteModal({ open: false, review: null });
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome, current: false },
    { name: 'Products', href: '/admin/products', icon: FiPackage, current: false },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag, current: false },
    { name: 'Users', href: '/admin/users', icon: FiUsers, current: false },
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: true },
    ...(user?.role === 'super-admin' ? [{ name: 'Financial', href: '/admin/financial', icon: FiDollarSign, current: false }] : []),
    { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: false },
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
        size={16}
      />
    ));
  };

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
                <h1 className='text-xl font-bold text-white'>Reviews</h1>
                <p className='text-sm text-gray-400'>Manage customer reviews</p>
              </div>
            </div>
          </div>
        </header>

        {/* Reviews Content */}
        <main className='p-4 lg:p-8'>
          {/* Filters */}
          <div className='flex flex-wrap gap-4 mb-6'>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Status</option>
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
            </select>
          </div>

          {/* Reviews Grid */}
          <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
            {loading ? (
              <div className='flex items-center justify-center py-20'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : reviews.length > 0 ? (
              <>
                <div className='divide-y divide-slate-800'>
                  {reviews.map((review) => (
                    <div key={review._id} className='p-6 hover:bg-slate-800/30 transition-colors'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                              <span className='text-white font-bold text-sm'>
                                {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className='text-white font-medium'>
                                {review.user?.firstName} {review.user?.lastName}
                              </p>
                              <div className='flex items-center gap-1'>
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            {review.isFeatured && (
                              <span className='px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs flex items-center gap-1'>
                                <FiAward size={12} />
                                Featured
                              </span>
                            )}
                            {review.isStoreReview && (
                              <span className='px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs'>
                                Store Review
                              </span>
                            )}
                          </div>

                          {review.product && (
                            <p className='text-gray-500 text-sm mb-2'>
                              Product: <span className='text-gray-300'>{review.product?.name}</span>
                            </p>
                          )}

                          {review.title && (
                            <p className='text-white font-medium mb-1'>{review.title}</p>
                          )}
                          <p className='text-gray-400'>{review.comment}</p>

                          <div className='flex items-center gap-4 mt-3'>
                            <span
                              className={`px-3 py-1 rounded-lg text-sm ${
                                review.status === 'approved'
                                  ? 'bg-green-500/10 text-green-400'
                                  : review.status === 'pending'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {review.status}
                            </span>
                            <span className='text-gray-500 text-sm'>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className='flex items-center gap-2'>
                          {review.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(review._id, 'approved')}
                                className='p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors'
                                title='Approve'
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(review._id, 'rejected')}
                                className='p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
                                title='Reject'
                              >
                                <FiXCircle size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleToggleFeatured(review._id)}
                            className={`p-2 rounded-lg transition-colors ${
                              review.isFeatured
                                ? 'text-yellow-400 hover:bg-yellow-500/10'
                                : 'text-gray-400 hover:bg-slate-800'
                            }`}
                            title={review.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            <FiAward size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, review })}
                            className='p-2 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors'
                            title='Delete'
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className='flex items-center justify-between px-6 py-4 border-t border-slate-800'>
                    <p className='text-gray-400 text-sm'>
                      Showing {(pagination.currentPage - 1) * 10 + 1} to{' '}
                      {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} reviews
                    </p>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => fetchReviews(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className='p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => fetchReviews(pagination.currentPage + 1)}
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
                <FiMessageSquare className='mx-auto text-gray-600 mb-4' size={48} />
                <h3 className='text-xl font-bold text-white mb-2'>No reviews found</h3>
                <p className='text-gray-400'>
                  {statusFilter !== 'all' ? 'Try different filter' : 'Reviews will appear here when customers submit them'}
                </p>
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
            onClick={() => setDeleteModal({ open: false, review: null })}
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
                <h3 className='text-xl font-bold text-white mb-2'>Delete Review</h3>
                <p className='text-gray-400 mb-6'>
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
                <div className='flex gap-4'>
                  <button
                    onClick={() => setDeleteModal({ open: false, review: null })}
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
