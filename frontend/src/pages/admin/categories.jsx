
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiGrid,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { categoryAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

export default function AdminCategories() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });

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

    fetchCategories();
  }, [isAuthenticated, user, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll();
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        const res = await categoryAPI.update(editingCategory._id, formData);
        if (res.data.success) {
          toast.success('Category updated successfully');
        }
      } else {
        const res = await categoryAPI.create(formData);
        if (res.data.success) {
          toast.success('Category created successfully');
        }
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', order: 0 });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      order: category.order || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;

    try {
      const res = await categoryAPI.delete(deleteModal.category._id);
      if (res.data.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setDeleteModal({ open: false, category: null });
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
                <h1 className='text-xl font-bold text-white'>Categories</h1>
                <p className='text-sm text-gray-400'>Manage product categories</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: '', description: '', order: 0 });
                setShowModal(true);
              }}
              className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
            >
              <FiPlus size={18} />
              Add Category
            </button>
          </div>
        </header>

        {/* Categories Content */}
        <main className='p-4 lg:p-8'>
          <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
            {loading ? (
              <div className='flex items-center justify-center py-20'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : categories.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-slate-800'>
                      <th className='text-left px-6 py-4 text-gray-400 font-medium'>Category</th>
                      <th className='text-left px-6 py-4 text-gray-400 font-medium'>Description</th>
                      <th className='text-left px-6 py-4 text-gray-400 font-medium'>Products</th>
                      <th className='text-left px-6 py-4 text-gray-400 font-medium'>Order</th>
                      <th className='text-right px-6 py-4 text-gray-400 font-medium'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category._id} className='border-b border-slate-800/50 hover:bg-slate-800/30'>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center'>
                              <FiGrid className='text-blue-400' size={20} />
                            </div>
                            <div>
                              <p className='text-white font-medium'>{category.name}</p>
                              <p className='text-gray-500 text-sm'>{category.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <p className='text-gray-400 text-sm truncate max-w-xs'>
                            {category.description || '-'}
                          </p>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='px-3 py-1 bg-slate-800 text-gray-300 rounded-lg text-sm'>
                            {category.productCount || 0} products
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-gray-400'>{category.order || 0}</span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center justify-end gap-2'>
                            <button
                              onClick={() => handleEdit(category)}
                              className='p-2 text-gray-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors'
                              title='Edit'
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, category })}
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
            ) : (
              <div className='text-center py-20'>
                <FiGrid className='mx-auto text-gray-600 mb-4' size={48} />
                <h3 className='text-xl font-bold text-white mb-2'>No categories found</h3>
                <p className='text-gray-400 mb-4'>Create your first category to get started</p>
                <button
                  onClick={() => setShowModal(true)}
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
                >
                  Add Category
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className='text-xl font-bold text-white mb-6'>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Category Name *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter category name'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                    placeholder='Enter category description'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Display Order
                  </label>
                  <input
                    type='number'
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='0'
                  />
                </div>

                <div className='flex gap-4 pt-4'>
                  <button
                    type='button'
                    onClick={() => setShowModal(false)}
                    className='flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={() => setDeleteModal({ open: false, category: null })}
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
                <h3 className='text-xl font-bold text-white mb-2'>Delete Category</h3>
                <p className='text-gray-400 mb-6'>
                  Are you sure you want to delete "{deleteModal.category?.name}"? This action cannot be undone.
                </p>
                <div className='flex gap-4'>
                  <button
                    onClick={() => setDeleteModal({ open: false, category: null })}
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
