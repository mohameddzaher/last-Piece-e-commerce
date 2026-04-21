'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  FiShoppingCart, FiHeart, FiSearch, FiMenu, FiX, FiUser, FiLogOut,
  FiPackage, FiSettings, FiGlobe,
} from 'react-icons/fi';
import { useCartStore, useWishlistStore, useAuthStore } from '@/store';
import { useI18n } from '@/utils/i18n';

/**
 * Header — no framer-motion on nav links (caused layoutId/Link click
 * interactions that sometimes swallowed navigations). Pure CSS transitions.
 */
export default function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartItemCount = useCartStore((s) => s.itemCount);
  const wishlistItemCount = useWishlistStore((s) => s.itemCount);
  const { isAuthenticated, user, logout } = useAuthStore();
  const lang = useI18n((s) => s.lang);
  const setLanguage = useI18n((s) => s.setLanguage);
  const t = useI18n((s) => s.t);

  const toggleLang = () => setLanguage(lang === 'en' ? 'ar' : 'en');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onClick = () => setIsUserMenuOpen(false);
    const id = setTimeout(() => document.addEventListener('click', onClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', onClick);
    };
  }, [isUserMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    const done = () => { setIsMobileMenuOpen(false); setIsSearchOpen(false); };
    router.events?.on('routeChangeComplete', done);
    return () => router.events?.off('routeChangeComplete', done);
  }, [router.events]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: t('nav.home', 'Home') },
    { href: '/products', label: t('nav.products', 'Products') },
    { href: '/about', label: t('nav.about', 'About') },
    { href: '/contact', label: t('nav.contact', 'Contact') },
  ];

  const navLinkClass = (href) => {
    const active = router.pathname === href;
    return `inline-block px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'text-white border-b-2 border-blue-500'
        : 'text-gray-200 hover:text-white border-b-2 border-transparent'
    }`;
  };

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-colors duration-300 border-b ${
        isScrolled
          ? 'bg-slate-950 border-slate-800 shadow-lg shadow-black/40'
          : 'bg-slate-950 border-slate-800/80 shadow-md shadow-black/30'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center justify-between h-16 gap-4'>
          {/* Logo — transparent PNG on the dark Header bg */}
          <Link href='/' className='flex items-center gap-2 shrink-0' aria-label='Last Piece home'>
            <Image
              src='/images/logo.png'
              alt='Last Piece'
              width={120}
              height={56}
              priority
              className='h-11 w-auto object-contain'
            />
          </Link>

          {/* Desktop Nav — simple anchors, no framer-motion */}
          <nav className='hidden md:flex items-center gap-6 flex-1 justify-center'>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className='flex items-center gap-0.5 shrink-0'>
            <button
              onClick={toggleLang}
              className='flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-white/10 text-gray-200 hover:text-white'
              title='Language'
            >
              <FiGlobe size={14} />
              <span className='text-[10px] font-bold uppercase'>{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>

            <button
              onClick={() => setIsSearchOpen((v) => !v)}
              className='p-2 rounded-lg hover:bg-white/10 text-gray-200 hover:text-white'
              aria-label='Search'
            >
              <FiSearch size={16} />
            </button>

            <Link
              href='/wishlist'
              className='relative p-2 rounded-lg hover:bg-white/10 text-gray-200 hover:text-white'
              aria-label='Wishlist'
            >
              <FiHeart size={16} />
              {wishlistItemCount > 0 && (
                <span className='absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                  {wishlistItemCount > 9 ? '9+' : wishlistItemCount}
                </span>
              )}
            </Link>

            <Link
              href='/cart'
              className='relative p-2 rounded-lg hover:bg-white/10 text-gray-200 hover:text-white'
              aria-label='Cart'
            >
              <FiShoppingCart size={16} />
              {cartItemCount > 0 && (
                <span className='absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            <div className='relative'>
              <button
                onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen((v) => !v); }}
                className='p-2 rounded-lg hover:bg-white/10 text-gray-200 hover:text-white'
                aria-label='Account'
              >
                <FiUser size={16} />
              </button>
              {isUserMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden'
                >
                  {isAuthenticated ? (
                    <>
                      <div className='px-3 py-2 bg-slate-700/50 border-b border-slate-700'>
                        <p className='text-xs font-medium text-white truncate'>{user?.firstName} {user?.lastName}</p>
                        <p className='text-[10px] text-gray-400 truncate'>{user?.email}</p>
                      </div>
                      <div className='py-1'>
                        <Link href='/dashboard' onClick={() => setIsUserMenuOpen(false)} className='flex items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:bg-slate-700 hover:text-white'>
                          <FiUser size={14} /> Dashboard
                        </Link>
                        <Link href='/orders' onClick={() => setIsUserMenuOpen(false)} className='flex items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:bg-slate-700 hover:text-white'>
                          <FiPackage size={14} /> My Orders
                        </Link>
                        {['admin', 'super-admin', 'saudi-staff', 'egypt-staff'].includes(user?.role) && (
                          <Link href='/admin' onClick={() => setIsUserMenuOpen(false)} className='flex items-center gap-2 px-3 py-2 text-xs text-purple-300 hover:bg-purple-500/10 hover:text-purple-200'>
                            <FiSettings size={14} /> Admin Panel
                          </Link>
                        )}
                        <hr className='my-1 border-slate-700' />
                        <button onClick={handleLogout} className='flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10'>
                          <FiLogOut size={14} /> Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className='py-1'>
                      <Link href='/login' onClick={() => setIsUserMenuOpen(false)} className='block px-3 py-2 text-xs text-gray-200 hover:bg-slate-700 hover:text-white'>Sign In</Link>
                      <Link href='/register' onClick={() => setIsUserMenuOpen(false)} className='block px-3 py-2 text-xs text-gray-200 hover:bg-slate-700 hover:text-white'>Create Account</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className='md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-200 hover:text-white'
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label='Menu'
            >
              {isMobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>
        </div>

        {/* Inline search (simple conditional, no AnimatePresence) */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className='pb-3'>
            <div className='relative'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={14} />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search for products...'
                className='w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                autoFocus
              />
            </div>
          </form>
        )}
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden bg-slate-900 border-t border-slate-800'>
          <nav className='px-4 py-3 space-y-1'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  router.pathname === link.href
                    ? 'bg-blue-500/20 text-white'
                    : 'text-gray-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className='my-2 border-slate-800' />
            {isAuthenticated ? (
              <>
                <Link href='/dashboard' onClick={() => setIsMobileMenuOpen(false)} className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-slate-800'>
                  <FiUser size={14} /> Dashboard
                </Link>
                <Link href='/orders' onClick={() => setIsMobileMenuOpen(false)} className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-slate-800'>
                  <FiPackage size={14} /> My Orders
                </Link>
                {['admin', 'super-admin', 'saudi-staff', 'egypt-staff'].includes(user?.role) && (
                  <Link href='/admin' onClick={() => setIsMobileMenuOpen(false)} className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-300 hover:bg-purple-500/10'>
                    <FiSettings size={14} /> Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className='flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10'>
                  <FiLogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href='/login' onClick={() => setIsMobileMenuOpen(false)} className='block px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-slate-800'>Sign In</Link>
                <Link href='/register' onClick={() => setIsMobileMenuOpen(false)} className='block px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 text-center'>Create Account</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
