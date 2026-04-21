'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome, FiPackage, FiBox, FiTruck, FiShoppingBag, FiUsers, FiTag, FiPercent,
  FiGift, FiFileText, FiDollarSign, FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX,
  FiCloud, FiArchive, FiRadio, FiCircle,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { useI18n } from '@/utils/i18n';
import { useSocketEvent, getSocket } from '@/utils/socket';
import { roleLabel } from '@/utils/format';

/**
 * Sidebar groups, gated by role. The map decides which roles can see each item;
 * the controllers also enforce authorization, this is just for UX.
 */
const NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: FiHome, roles: ['super-admin', 'admin', 'saudi-staff', 'egypt-staff'] },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { href: '/admin/inventory/saudi', label: 'Saudi Inventory', icon: FiArchive, roles: ['super-admin', 'admin', 'saudi-staff'] },
      { href: '/admin/inventory/transit', label: 'In Transit', icon: FiTruck, roles: ['super-admin', 'admin', 'saudi-staff'] },
      { href: '/admin/inventory/online', label: 'Egypt — Online', icon: FiCloud, roles: ['super-admin', 'admin', 'egypt-staff'] },
      { href: '/admin/inventory/offline', label: 'Egypt — Boutique', icon: FiShoppingBag, roles: ['super-admin', 'admin', 'egypt-staff'] },
      { href: '/admin/products/new', label: '+ Register Product', icon: FiBox, roles: ['super-admin', 'admin', 'saudi-staff'] },
      { href: '/admin/products', label: 'All Products', icon: FiPackage, roles: ['super-admin', 'admin'] },
    ],
  },
  {
    group: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Online Orders', icon: FiPackage, roles: ['super-admin', 'admin'] },
      { href: '/admin/sales', label: 'Boutique Sales', icon: FiDollarSign, roles: ['super-admin', 'admin', 'egypt-staff'] },
      { href: '/admin/promo-codes', label: 'Promo Codes', icon: FiPercent, roles: ['super-admin', 'admin'] },
      { href: '/admin/referrals', label: 'Referrals', icon: FiGift, roles: ['super-admin', 'admin'] },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { href: '/admin/categories', label: 'Categories', icon: FiTag, roles: ['super-admin', 'admin'] },
      { href: '/admin/brands', label: 'Brands', icon: FiTag, roles: ['super-admin', 'admin'] },
      { href: '/admin/reviews', label: 'Reviews', icon: FiFileText, roles: ['super-admin', 'admin'] },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/admin/shipments', label: 'Shipments', icon: FiTruck, roles: ['super-admin', 'admin', 'saudi-staff'] },
      { href: '/admin/expenses', label: 'Expenses', icon: FiDollarSign, roles: ['super-admin', 'admin'] },
      { href: '/admin/financial', label: 'Financial Report', icon: FiBarChart2, roles: ['super-admin'] },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/admin/users', label: 'Team', icon: FiUsers, roles: ['super-admin'] },
      { href: '/admin/site-cms', label: 'Site Content', icon: FiFileText, roles: ['super-admin', 'admin'] },
      { href: '/admin/settings', label: 'Settings', icon: FiSettings, roles: ['super-admin'] },
    ],
  },
];

const SocketIndicator = () => {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    setConnected(s.connected);
    const onConn = () => setConnected(true);
    const onDis = () => setConnected(false);
    s.on('connect', onConn);
    s.on('disconnect', onDis);
    return () => {
      s.off('connect', onConn);
      s.off('disconnect', onDis);
    };
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
      <FiCircle className={connected ? 'text-emerald-400 fill-current' : 'text-rose-400 fill-current'} size={6} />
      {connected ? 'Live' : 'Offline'}
    </span>
  );
};

export default function AdminLayout({ children, title, actions }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const t = useI18n((s) => s.t);
  const lang = useI18n((s) => s.lang);
  const setLanguage = useI18n((s) => s.setLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth-gate strategy:
  //   The zustand auth store hydrates asynchronously after _app.jsx calls
  //   authAPI.getProfile() on mount. We must NOT redirect before the user
  //   object has had a chance to arrive — otherwise we flash-redirect a
  //   super-admin to /login while their token is still being validated.
  //
  //   We give a 1.2s window for the session to restore. If there's a token in
  //   localStorage we wait longer (authenticated state will resolve). If
  //   there's no token at all we redirect almost immediately.
  const [gateDecision, setGateDecision] = useState(null); // 'wait' | 'allow' | 'reject-login' | 'reject-home'

  useEffect(() => {
    const hasToken =
      typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

    if (isAuthenticated && user?.role) {
      const allowed = ['super-admin', 'admin', 'saudi-staff', 'egypt-staff'];
      setGateDecision(allowed.includes(user.role) ? 'allow' : 'reject-home');
      return;
    }

    // Still hydrating — keep waiting.
    setGateDecision('wait');
    const timer = setTimeout(() => {
      if (!hasToken) {
        setGateDecision('reject-login');
      } else if (!isAuthenticated || !user?.role) {
        // Token exists but profile fetch failed / hung — fall back to login.
        setGateDecision('reject-login');
      }
    }, hasToken ? 3000 : 600);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (gateDecision === 'reject-login') {
      router.push('/login?next=' + encodeURIComponent(router.asPath));
    } else if (gateDecision === 'reject-home') {
      router.push('/');
    }
  }, [gateDecision, router]);

  useSocketEvent('connected', () => {});

  if (gateDecision !== 'allow') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  const role = user.role;
  const visibleGroups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-2 group">
            <img
              src="/images/logo-dark-bg.png"
              alt="Last Piece"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="text-xs font-bold tracking-wider">LAST PIECE</div>
              <div className="text-[10px] text-slate-500">Admin Panel</div>
            </div>
            <SocketIndicator />
          </Link>
        </div>

        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium truncate">{user.firstName} {user.lastName}</div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-slate-500">{roleLabel(role)}</span>
            <button
              onClick={() => setLanguage(lang === 'en' ? 'ar' : 'en')}
              className="text-[10px] font-bold text-blue-500 hover:text-blue-600"
              title={t('nav.language', 'Language')}
            >
              {lang === 'en' ? 'AR' : 'EN'}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {visibleGroups.map((g) => (
            <div key={g.group} className="mb-3">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{g.group}</div>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = router.pathname === item.href || (item.href !== '/admin' && router.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                        active
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiRadio size={14} />
            View Public Site
          </Link>
          <button
            onClick={() => { logout(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); router.push('/login'); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-rose-500 hover:bg-rose-500/10"
          >
            <FiLogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                {sidebarOpen ? <FiX size={16} /> : <FiMenu size={16} />}
              </button>
              <h1 className="text-sm font-semibold truncate">{title || 'Admin'}</h1>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        </header>

        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
