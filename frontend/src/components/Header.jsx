'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiShoppingCart, FiHeart, FiSearch, FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { useCartStore, useWishlistStore, useAuthStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartItemCount = useCartStore((state) => state.itemCount);
  const wishlistItemCount = useWishlistStore((state) => state.itemCount);
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };
    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

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
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-slate-900/80 backdrop-blur-sm'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center justify-between h-14'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2 group'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform'>
              <span className='text-white font-bold text-sm'>L</span>
            </div>
            <span className='text-base font-bold text-white group-hover:text-blue-400 transition-colors'>
              LAST PIECE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center gap-6'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-medium transition-colors relative py-1.5 ${
                  router.pathname === link.href
                    ? 'text-blue-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
                {router.pathname === link.href && (
                  <motion.div
                    layoutId='activeNav'
                    className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500'
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className='flex items-center gap-1'>
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className='p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white'
              aria-label='Search'
            >
              <FiSearch size={16} />
            </button>

            {/* Wishlist */}
            <Link
              href='/wishlist'
              className='relative p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white'
              aria-label='Wishlist'
            >
              <FiHeart size={16} />
              {wishlistItemCount > 0 && (
                <span className='absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                  {wishlistItemCount > 9 ? '9+' : wishlistItemCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href='/cart'
              className='relative p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white'
              aria-label='Cart'
            >
              <FiShoppingCart size={16} />
              {cartItemCount > 0 && (
                <span className='absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className='relative'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className='p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white'
                aria-label='User menu'
              >
                <FiUser size={16} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    className='absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden'
                  >
                    {isAuthenticated ? (
                      <>
                        <div className='px-3 py-2 bg-slate-700/50 border-b border-slate-700'>
                          <p className='text-xs font-medium text-white truncate'>
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className='text-[10px] text-gray-400 truncate'>{user?.email}</p>
                        </div>
                        <div className='py-1'>
                          <Link
                            href='/dashboard'
                            onClick={() => setIsUserMenuOpen(false)}
                            className='flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-slate-700 hover:text-white transition-colors'
                          >
                            <FiUser size={14} />
                            Dashboard
                          </Link>
                          <Link
                            href='/orders'
                            onClick={() => setIsUserMenuOpen(false)}
                            className='flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-slate-700 hover:text-white transition-colors'
                          >
                            <FiPackage size={14} />
                            My Orders
                          </Link>
                          {(user?.role === 'admin' || user?.role === 'super-admin') && (
                            <Link
                              href='/admin'
                              onClick={() => setIsUserMenuOpen(false)}
                              className='flex items-center gap-2 px-3 py-2 text-xs text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors'
                            >
                              <FiSettings size={14} />
                              Admin Panel
                            </Link>
                          )}
                          <hr className='my-1 border-slate-700' />
                          <button
                            onClick={handleLogout}
                            className='flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors'
                          >
                            <FiLogOut size={14} />
                            Logout
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className='py-1'>
                        <Link
                          href='/login'
                          onClick={() => setIsUserMenuOpen(false)}
                          className='flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-slate-700 hover:text-white transition-colors'
                        >
                          Sign In
                        </Link>
                        <Link
                          href='/register'
                          onClick={() => setIsUserMenuOpen(false)}
                          className='flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-slate-700 hover:text-white transition-colors'
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              className='md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label='Menu'
            >
              {isMobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='overflow-hidden'
            >
              <form onSubmit={handleSearch} className='pb-3'>
                <div className='relative'>
                  <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={14} />
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search for products...'
                    className='w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    autoFocus
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='md:hidden bg-slate-900 border-t border-slate-800 overflow-hidden'
          >
            <nav className='px-4 py-3 space-y-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    router.pathname === link.href
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className='my-2 border-slate-800' />
              {isAuthenticated ? (
                <>
                  <Link
                    href='/dashboard'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-slate-800 hover:text-white transition-colors'
                  >
                    <FiUser size={14} />
                    Dashboard
                  </Link>
                  <Link
                    href='/orders'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-slate-800 hover:text-white transition-colors'
                  >
                    <FiPackage size={14} />
                    My Orders
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'super-admin') && (
                    <Link
                      href='/admin'
                      onClick={() => setIsMobileMenuOpen(false)}
                      className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-purple-400 hover:bg-purple-500/10 transition-colors'
                    >
                      <FiSettings size={14} />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className='flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors'
                  >
                    <FiLogOut size={14} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href='/login'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='block px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-slate-800 hover:text-white transition-colors'
                  >
                    Sign In
                  </Link>
                  <Link
                    href='/register'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='block px-3 py-2 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors text-center'
                  >
                    Create Account
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
