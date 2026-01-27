
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
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiBarChart2,
  FiStar,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { adminAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

export default function FinancialReport() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isSuperAdmin) {
      router.push('/admin');
      toast.error('Access denied. Super Admin privileges required.');
      return;
    }

    fetchFinancialReport();
  }, [isAuthenticated, user, router]);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }
      const res = await adminAPI.getFinancialReport(params);
      if (res.data.success) {
        setReport(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching financial report:', error);
      toast.error('Failed to load financial report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchFinancialReport();
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
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: false },
    { name: 'Financial Report', href: '/admin/financial', icon: FiBarChart2, current: true },
    { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: false },
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
                <h1 className='text-xl font-bold text-white'>Financial Report</h1>
                <p className='text-sm text-gray-400'>Super Admin Only - Detailed financial analytics</p>
              </div>
            </div>
          </div>
        </header>

        {/* Report Content */}
        <main className='p-4 lg:p-8'>
          {/* Date Filter */}
          <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8'>
            <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
              <FiCalendar className='text-blue-400' />
              Filter by Date Range
            </h2>
            <form onSubmit={handleDateFilter} className='flex flex-wrap gap-4 items-end'>
              <div>
                <label className='block text-sm text-gray-400 mb-2'>Start Date</label>
                <input
                  type='date'
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className='px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm text-gray-400 mb-2'>End Date</label>
                <input
                  type='date'
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className='px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <button
                type='submit'
                className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
              >
                Apply Filter
              </button>
              <button
                type='button'
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  fetchFinancialReport();
                }}
                className='px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors'
              >
                Clear
              </button>
            </form>
          </div>

          {/* Summary Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center'>
                  <FiDollarSign className='text-green-400' size={24} />
                </div>
                <span className='text-green-400 font-medium'>Total Revenue</span>
              </div>
              <p className='text-3xl font-bold text-white'>
                ${report?.summary?.totalRevenue?.toLocaleString() || 0}
              </p>
              <p className='text-sm text-gray-400 mt-2'>
                {report?.summary?.completedOrders || 0} completed orders
              </p>
            </div>

            <div className='bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center'>
                  <FiTrendingUp className='text-blue-400' size={24} />
                </div>
                <span className='text-blue-400 font-medium'>Subtotal</span>
              </div>
              <p className='text-3xl font-bold text-white'>
                ${report?.summary?.subtotal?.toLocaleString() || 0}
              </p>
              <p className='text-sm text-gray-400 mt-2'>Before shipping & discounts</p>
            </div>

            <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center'>
                  <FiPackage className='text-purple-400' size={24} />
                </div>
                <span className='text-purple-400 font-medium'>Shipping Earned</span>
              </div>
              <p className='text-3xl font-bold text-white'>
                ${report?.summary?.totalShipping?.toLocaleString() || 0}
              </p>
              <p className='text-sm text-gray-400 mt-2'>Total shipping fees</p>
            </div>

            <div className='bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 rounded-2xl p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center'>
                  <FiTrendingDown className='text-red-400' size={24} />
                </div>
                <span className='text-red-400 font-medium'>Discounts Given</span>
              </div>
              <p className='text-3xl font-bold text-white'>
                ${report?.summary?.totalDiscount?.toLocaleString() || 0}
              </p>
              <p className='text-sm text-gray-400 mt-2'>Total discounts applied</p>
            </div>
          </div>

          {/* Cancelled Orders Loss */}
          {(report?.summary?.cancelledCount > 0) && (
            <div className='bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8'>
              <h3 className='text-lg font-semibold text-red-400 mb-2'>Cancelled Orders</h3>
              <div className='flex items-center gap-8'>
                <div>
                  <p className='text-2xl font-bold text-white'>{report?.summary?.cancelledCount}</p>
                  <p className='text-sm text-gray-400'>Orders cancelled</p>
                </div>
                <div>
                  <p className='text-2xl font-bold text-red-400'>-${report?.summary?.cancelledLoss?.toLocaleString() || 0}</p>
                  <p className='text-sm text-gray-400'>Potential revenue lost</p>
                </div>
              </div>
            </div>
          )}

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Revenue by Payment Method */}
            <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
              <h3 className='text-lg font-semibold text-white mb-6'>Revenue by Payment Method</h3>
              {report?.revenueByPaymentMethod?.length > 0 ? (
                <div className='space-y-4'>
                  {report.revenueByPaymentMethod.map((item) => (
                    <div key={item._id} className='flex items-center justify-between p-4 bg-slate-800/50 rounded-xl'>
                      <div>
                        <p className='text-white font-medium capitalize'>{item._id || 'Unknown'}</p>
                        <p className='text-sm text-gray-400'>{item.count} orders</p>
                      </div>
                      <p className='text-xl font-bold text-green-400'>${item.total?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <FiBarChart2 className='mx-auto text-gray-600 mb-3' size={40} />
                  <p className='text-gray-400'>No data available</p>
                </div>
              )}
            </div>

            {/* Top Selling Products */}
            <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
              <h3 className='text-lg font-semibold text-white mb-6'>Top Selling Products</h3>
              {report?.topProducts?.length > 0 ? (
                <div className='space-y-4'>
                  {report.topProducts.slice(0, 5).map((item, idx) => (
                    <div key={item._id} className='flex items-center justify-between p-4 bg-slate-800/50 rounded-xl'>
                      <div className='flex items-center gap-3'>
                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-slate-700 text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className='text-white font-medium'>{item.name}</p>
                          <p className='text-sm text-gray-400'>{item.totalQuantity} sold</p>
                        </div>
                      </div>
                      <p className='text-lg font-bold text-green-400'>${item.totalRevenue?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <FiPackage className='mx-auto text-gray-600 mb-3' size={40} />
                  <p className='text-gray-400'>No sales data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Revenue - Last 30 Days */}
          {report?.dailyRevenue?.length > 0 && (
            <div className='mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6'>
              <h3 className='text-lg font-semibold text-white mb-6'>Daily Revenue (Last 30 Days)</h3>
              <div className='overflow-x-auto'>
                <div className='flex gap-2 min-w-max pb-4'>
                  {report.dailyRevenue.map((day) => {
                    const maxRevenue = Math.max(...report.dailyRevenue.map(d => d.revenue));
                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={`${day._id.year}-${day._id.month}-${day._id.day}`} className='flex flex-col items-center'>
                        <div className='h-32 w-8 bg-slate-800 rounded-lg relative overflow-hidden'>
                          <div
                            className='absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-lg transition-all'
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <p className='text-xs text-gray-500 mt-2'>{day._id.day}/{day._id.month}</p>
                        <p className='text-xs text-green-400'>${day.revenue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
