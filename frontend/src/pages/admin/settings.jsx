
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiGrid,
  FiStar,
  FiShield,
  FiMail,
  FiGlobe,
  FiDollarSign,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { toast } from 'react-toastify';

export default function AdminSettings() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

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
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome, current: false },
    { name: 'Products', href: '/admin/products', icon: FiPackage, current: false },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag, current: false },
    { name: 'Users', href: '/admin/users', icon: FiUsers, current: false },
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: false },
    ...(user?.role === 'super-admin' ? [{ name: 'Financial', href: '/admin/financial', icon: FiDollarSign, current: false }] : []),
    { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: true },
  ];

  const settingsTabs = [
    { id: 'general', label: 'General', icon: FiGlobe },
    { id: 'categories', label: 'Categories', icon: FiGrid },
    { id: 'reviews', label: 'Reviews', icon: FiStar },
    { id: 'security', label: 'Security', icon: FiShield },
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
                <h1 className='text-xl font-bold text-white'>Settings</h1>
                <p className='text-sm text-gray-400'>Manage store settings</p>
              </div>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <main className='p-4 lg:p-8'>
          <div className='max-w-4xl mx-auto'>
            {/* Settings Navigation */}
            <div className='flex flex-wrap gap-2 mb-8'>
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* General Settings */}
            {activeTab === 'general' && (
              <div className='space-y-6'>
                <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                  <h2 className='text-lg font-semibold text-white mb-6'>Store Information</h2>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Store Name
                      </label>
                      <input
                        type='text'
                        defaultValue='Last Piece'
                        className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Store Description
                      </label>
                      <textarea
                        defaultValue='Exclusive last-piece shoes at unbeatable prices'
                        rows={3}
                        className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Contact Email
                      </label>
                      <input
                        type='email'
                        defaultValue='support@lastpiece.com'
                        className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>
                  <button className='mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'>
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Categories Settings */}
            {activeTab === 'categories' && (
              <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-lg font-semibold text-white'>Manage Categories</h2>
                  <Link
                    href='/admin/categories'
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
                  >
                    Go to Categories
                  </Link>
                </div>
                <p className='text-gray-400'>
                  Manage product categories, add new categories, edit existing ones, or remove categories you no longer need.
                </p>
              </div>
            )}

            {/* Reviews Settings */}
            {activeTab === 'reviews' && (
              <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-lg font-semibold text-white'>Manage Reviews</h2>
                  <Link
                    href='/admin/reviews'
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
                  >
                    Go to Reviews
                  </Link>
                </div>
                <p className='text-gray-400'>
                  View and moderate customer reviews. Approve, edit, or remove reviews to maintain quality content on your store.
                </p>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className='space-y-6'>
                <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                  <h2 className='text-lg font-semibold text-white mb-6'>Admin Account</h2>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between p-4 bg-slate-800 rounded-xl'>
                      <div>
                        <p className='text-white font-medium'>Current Role</p>
                        <p className='text-gray-400 text-sm'>{user?.role}</p>
                      </div>
                      <span className='px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm'>
                        {user?.role}
                      </span>
                    </div>
                    <div className='flex items-center justify-between p-4 bg-slate-800 rounded-xl'>
                      <div>
                        <p className='text-white font-medium'>Email</p>
                        <p className='text-gray-400 text-sm'>{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {user?.role === 'super-admin' && (
                  <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                    <h2 className='text-lg font-semibold text-white mb-4'>Super Admin Privileges</h2>
                    <p className='text-gray-400 mb-4'>
                      As a super admin, you have full access to all features including:
                    </p>
                    <ul className='space-y-2 text-gray-400'>
                      <li className='flex items-center gap-2'>
                        <FiShield className='text-green-400' size={16} />
                        Change user roles (admin/user)
                      </li>
                      <li className='flex items-center gap-2'>
                        <FiShield className='text-green-400' size={16} />
                        Full access to all settings
                      </li>
                      <li className='flex items-center gap-2'>
                        <FiShield className='text-green-400' size={16} />
                        Delete any content
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
