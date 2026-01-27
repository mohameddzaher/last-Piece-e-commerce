
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
  FiMail,
  FiCalendar,
  FiShield,
  FiSlash,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiDollarSign,
  FiStar,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { adminAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';
import { FiDownload } from 'react-icons/fi';

const roleColors = {
  customer: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'super-admin': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const statusColors = {
  active: 'bg-green-500/10 text-green-400',
  blocked: 'bg-red-500/10 text-red-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
};

export default function AdminUsers() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [blockModal, setBlockModal] = useState({ open: false, user: null });
  const [roleModal, setRoleModal] = useState({ open: false, user: null });
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [newRole, setNewRole] = useState('');
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: '', status: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (user?.role !== 'super-admin') {
      toast.error('Only Super Admin can export data');
      return;
    }
    try {
      setExporting(true);
      const response = await adminAPI.exportUsers();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
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

    fetchUsers();
  }, [isAuthenticated, user, router, roleFilter]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers({ page, limit: 10, search, role: roleFilter });
      if (res.data.success) {
        setUsers(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, currentPage: 1 });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleBlockUser = async () => {
    if (!blockModal.user) return;

    try {
      const res = await adminAPI.blockUser(blockModal.user._id);
      if (res.data.success) {
        toast.success('User blocked successfully');
        fetchUsers(pagination.currentPage);
      }
    } catch (error) {
      toast.error('Failed to block user');
    } finally {
      setBlockModal({ open: false, user: null });
    }
  };

  const handleUpdateRole = async () => {
    if (!roleModal.user || !newRole) return;

    try {
      const res = await adminAPI.updateUserRole(roleModal.user._id, newRole);
      if (res.data.success) {
        toast.success('User role updated');
        fetchUsers(pagination.currentPage);
      }
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setRoleModal({ open: false, user: null });
      setNewRole('');
    }
  };

  const openEditModal = (u) => {
    setEditForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role || 'user',
      status: u.status || 'active',
    });
    setEditModal({ open: true, user: u });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editModal.user) return;

    try {
      setEditLoading(true);
      const updateData = { ...editForm };
      if (!updateData.password) delete updateData.password;

      const res = await adminAPI.updateUser(editModal.user._id, updateData);
      if (res.data.success) {
        toast.success('User updated successfully');
        fetchUsers(pagination.currentPage);
        setEditModal({ open: false, user: null });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
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
    { name: 'Users', href: '/admin/users', icon: FiUsers, current: true },
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: false },
    ...(user?.role === 'super-admin' ? [{ name: 'Financial', href: '/admin/financial', icon: FiDollarSign, current: false }] : []),
    { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: false },
  ];

  const roles = ['customer', 'admin', 'super-admin'];

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
                <h1 className='text-xl font-bold text-white'>Users</h1>
                <p className='text-sm text-gray-400'>Manage platform users</p>
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

        {/* Users Content */}
        <main className='p-4 lg:p-8'>
          {/* Search and Filters */}
          <div className='flex flex-col sm:flex-row gap-4 mb-6'>
            <form onSubmit={handleSearch} className='flex-1 relative'>
              <FiSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search by name or email...'
                className='w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </form>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className='px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === 'customer' ? 'Customer' : role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter Pills */}
          <div className='flex flex-wrap gap-2 mb-6'>
            <button
              onClick={() => setRoleFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !roleFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  roleFilter === role
                    ? roleColors[role]
                    : 'bg-slate-800 text-gray-400 hover:text-white'
                }`}
              >
                <FiShield size={14} />
                {role === 'customer' ? 'Customer' : role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Users Table */}
          <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
            {loading ? (
              <div className='flex items-center justify-center py-20'>
                <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : users.length > 0 ? (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-slate-800'>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>User</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Email</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Role</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Status</th>
                        <th className='text-left px-6 py-4 text-gray-400 font-medium'>Joined</th>
                        <th className='text-right px-6 py-4 text-gray-400 font-medium'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className='border-b border-slate-800/50 hover:bg-slate-800/30'>
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-4'>
                              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0'>
                                <span className='text-white font-bold text-sm'>
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className='text-white font-medium'>
                                  {u.firstName} {u.lastName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-2 text-gray-400'>
                              <FiMail size={14} />
                              {u.email}
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <span className={`px-3 py-1 rounded-lg text-sm border ${roleColors[u.role]}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className='px-6 py-4'>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm ${
                                statusColors[u.status] || statusColors.active
                              }`}
                            >
                              {u.status === 'blocked' ? (
                                <FiAlertCircle size={14} />
                              ) : (
                                <FiCheckCircle size={14} />
                              )}
                              {u.status || 'active'}
                            </span>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-2 text-gray-400 text-sm'>
                              <FiCalendar size={14} />
                              {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center justify-end gap-2'>
                              {user?.role === 'super-admin' && u._id !== user._id && (
                                <>
                                  <button
                                    onClick={() => openEditModal(u)}
                                    className='p-2 text-gray-400 hover:text-green-400 hover:bg-slate-800 rounded-lg transition-colors'
                                    title='Edit User'
                                  >
                                    <FiEdit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRoleModal({ open: true, user: u });
                                      setNewRole(u.role);
                                    }}
                                    className='p-2 text-gray-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors'
                                    title='Change Role'
                                  >
                                    <FiShield size={18} />
                                  </button>
                                </>
                              )}
                              {u._id !== user._id && u.status !== 'blocked' && (
                                <button
                                  onClick={() => setBlockModal({ open: true, user: u })}
                                  className='p-2 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors'
                                  title='Block User'
                                >
                                  <FiSlash size={18} />
                                </button>
                              )}
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
                      {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} users
                    </p>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => fetchUsers(pagination.currentPage - 1)}
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
                              onClick={() => fetchUsers(page)}
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
                        onClick={() => fetchUsers(pagination.currentPage + 1)}
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
                <FiUsers className='mx-auto text-gray-600 mb-4' size={48} />
                <h3 className='text-xl font-bold text-white mb-2'>No users found</h3>
                <p className='text-gray-400'>
                  {search || roleFilter ? 'Try different filters' : 'Users will appear here'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Block User Modal */}
      <AnimatePresence>
        {blockModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={() => setBlockModal({ open: false, user: null })}
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
                  <FiSlash className='text-red-400' size={32} />
                </div>
                <h3 className='text-xl font-bold text-white mb-2'>Block User</h3>
                <p className='text-gray-400 mb-6'>
                  Are you sure you want to block {blockModal.user?.firstName} {blockModal.user?.lastName}?
                  They will no longer be able to access their account.
                </p>
                <div className='flex gap-4'>
                  <button
                    onClick={() => setBlockModal({ open: false, user: null })}
                    className='flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className='flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors'
                  >
                    Block
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Role Modal */}
      <AnimatePresence>
        {roleModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={() => setRoleModal({ open: false, user: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className='text-xl font-bold text-white mb-2'>Change User Role</h3>
              <p className='text-gray-400 mb-6'>
                Update role for {roleModal.user?.firstName} {roleModal.user?.lastName}
              </p>

              <div className='space-y-3 mb-6'>
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewRole(role)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all ${
                      newRole === role
                        ? roleColors[role]
                        : 'border-slate-700 text-gray-400 hover:border-slate-600'
                    }`}
                  >
                    <FiShield size={18} />
                    <span className='capitalize'>{role.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>

              <div className='flex gap-4'>
                <button
                  onClick={() => setRoleModal({ open: false, user: null })}
                  className='flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  className='flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={() => setEditModal({ open: false, user: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-white'>Edit User</h3>
                <button
                  onClick={() => setEditModal({ open: false, user: null })}
                  className='text-gray-400 hover:text-white'
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm text-gray-400 mb-2'>First Name</label>
                    <input
                      type='text'
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm text-gray-400 mb-2'>Last Name</label>
                    <input
                      type='text'
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm text-gray-400 mb-2'>Email</label>
                  <input
                    type='email'
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm text-gray-400 mb-2'>Phone</label>
                  <input
                    type='text'
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder='Optional'
                    className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm text-gray-400 mb-2'>New Password (leave blank to keep current)</label>
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder='Enter new password'
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm text-gray-400 mb-2'>Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm text-gray-400 mb-2'>Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='active'>Active</option>
                      <option value='blocked'>Blocked</option>
                      <option value='pending'>Pending</option>
                    </select>
                  </div>
                </div>

                <div className='flex gap-4 pt-4'>
                  <button
                    type='button'
                    onClick={() => setEditModal({ open: false, user: null })}
                    className='flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={editLoading}
                    className='flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl font-medium transition-colors'
                  >
                    {editLoading ? (
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto' />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
