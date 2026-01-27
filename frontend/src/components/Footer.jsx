'use client';

import Link from 'next/link';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiMapPin, FiPhone, FiTruck, FiShield, FiRefreshCw, FiCreditCard } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-slate-900 border-t border-slate-800'>
      {/* Trust Badges */}
      <div className='border-b border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 bg-blue-500/10 rounded-lg'>
                <FiTruck className='text-blue-400' size={16} />
              </div>
              <div>
                <p className='text-white text-xs font-medium'>Free Shipping</p>
                <p className='text-gray-500 text-[10px]'>On orders over $150</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 bg-green-500/10 rounded-lg'>
                <FiShield className='text-green-400' size={16} />
              </div>
              <div>
                <p className='text-white text-xs font-medium'>Authenticity</p>
                <p className='text-gray-500 text-[10px]'>100% genuine products</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 bg-purple-500/10 rounded-lg'>
                <FiRefreshCw className='text-purple-400' size={16} />
              </div>
              <div>
                <p className='text-white text-xs font-medium'>Easy Returns</p>
                <p className='text-gray-500 text-[10px]'>14-day return policy</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 bg-amber-500/10 rounded-lg'>
                <FiCreditCard className='text-amber-400' size={16} />
              </div>
              <div>
                <p className='text-white text-xs font-medium'>Secure Payment</p>
                <p className='text-gray-500 text-[10px]'>SSL encrypted checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          {/* Brand Section */}
          <div className='col-span-2 md:col-span-1'>
            <Link href='/' className='flex items-center gap-2 mb-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>L</span>
              </div>
              <span className='text-sm font-bold text-white'>LAST PIECE</span>
            </Link>
            <p className='text-gray-400 text-xs leading-relaxed mb-3'>
              Exclusive sneakers where every pair is one-of-a-kind. When it's gone, it's gone forever.
            </p>
            <div className='flex gap-2'>
              {[
                { Icon: FiFacebook, href: '#' },
                { Icon: FiTwitter, href: '#' },
                { Icon: FiInstagram, href: '#' },
              ].map(({ Icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  className='p-2 bg-slate-800 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors'
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className='font-semibold text-sm text-white mb-3'>Shop</h4>
            <ul className='space-y-2'>
              {[
                { href: '/products', label: 'All Sneakers' },
                { href: '/products?category=sneakers', label: 'Sneakers' },
                { href: '/products?category=running', label: 'Running' },
                { href: '/products?category=casual', label: 'Casual' },
                { href: '/products?category=limited-edition', label: 'Limited Edition' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className='text-gray-400 hover:text-white text-xs transition-colors'>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className='font-semibold text-sm text-white mb-3'>Help</h4>
            <ul className='space-y-2'>
              {[
                { href: '/contact', label: 'Contact Us' },
                { href: '/faq', label: 'FAQ' },
                { href: '/shipping', label: 'Shipping Info' },
                { href: '/returns', label: 'Returns & Exchanges' },
                { href: '/size-guide', label: 'Size Guide' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className='text-gray-400 hover:text-white text-xs transition-colors'>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className='font-semibold text-sm text-white mb-3'>Contact</h4>
            <ul className='space-y-2'>
              <li className='flex items-center gap-2 text-gray-400 text-xs'>
                <FiMail size={12} />
                <span>Info@lastpiece.com</span>
              </li>
              <li className='flex items-center gap-2 text-gray-400 text-xs'>
                <FiPhone size={12} />
                <span>+966 53 848 6109</span>
              </li>
              <li className='flex items-start gap-2 text-gray-400 text-xs'>
                <FiMapPin size={12} className='mt-0.5' />
                <span>Jeddah, Saudi Arabia</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div className='mt-4'>
              <p className='text-xs text-gray-400 mb-2'>Get notified about new drops</p>
              <div className='flex gap-1'>
                <input
                  type='email'
                  placeholder='Email'
                  className='flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
                <button className='px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors'>
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className='border-t border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-2'>
            <p className='text-gray-500 text-xs'>
              &copy; {currentYear} Last Piece. All rights reserved.
            </p>
            <div className='flex gap-4'>
              <Link href='/privacy' className='text-gray-500 hover:text-gray-300 text-xs transition-colors'>
                Privacy
              </Link>
              <Link href='/terms' className='text-gray-500 hover:text-gray-300 text-xs transition-colors'>
                Terms
              </Link>
              <Link href='/cookies' className='text-gray-500 hover:text-gray-300 text-xs transition-colors'>
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
