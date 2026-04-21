
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCopy } from 'react-icons/fi';
import { authAPI } from '@/utils/endpoints';
import { useAuthStore } from '@/store';
import { toast } from 'react-toastify';

// TEMPORARY — team accounts shown on the login screen while we're still in
// the QA/testing phase so the user doesn't have to remember 4 passwords while
// switching roles. REMOVE THIS BLOCK (and its JSX usage below) before public
// launch. Passwords match what backend/seed-fresh.js creates.
const TEST_ACCOUNTS = [
  { label: 'Mohamed · super-admin', email: 'mohamed@lastpiece.com', password: 'Founder@2026' },
  { label: 'Sameh · super-admin',   email: 'sameh@lastpiece.com',   password: 'Founder@2026' },
  { label: 'Asmaa · saudi-staff',   email: 'asmaa@lastpiece.com',   password: 'Asmaa@2026' },
  { label: 'Islam · egypt-staff',   email: 'islam@lastpiece.com',   password: 'Islam@2026' },
];

export default function Login() {
  const router = useRouter();
  const { setUser, setTokens, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authAPI.login(formData);
      if (res.data.success) {
        setUser(res.data.data.user);
        setTokens(res.data.data.tokens);
        localStorage.setItem('accessToken', res.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', res.data.data.tokens.refreshToken);
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-950 flex'>
      {/* Left Side - Form */}
      <div className='flex-1 flex items-center justify-center px-4 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='w-full max-w-sm'
        >
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2 mb-6'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>L</span>
            </div>
            <span className='text-base font-bold text-white'>LAST PIECE</span>
          </Link>

          <h1 className='text-xl font-bold text-white mb-1'>Welcome back</h1>
          <p className='text-gray-400 text-xs mb-6'>Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Email */}
            <div>
              <label className='block text-xs font-medium text-gray-300 mb-1.5'>Email Address</label>
              <div className='relative'>
                <FiMail className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' size={14} />
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className='w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                  placeholder='you@example.com'
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-xs font-medium text-gray-300 mb-1.5'>Password</label>
              <div className='relative'>
                <FiLock className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' size={14} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className='w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                  placeholder='••••••••'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300'
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className='flex justify-end'>
              <Link href='/forgot-password' className='text-xs text-blue-400 hover:text-blue-300 transition-colors'>
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading}
              className='w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className='flex items-center gap-3 my-6'>
            <div className='flex-1 h-px bg-slate-800'></div>
            <span className='text-xs text-gray-500'>or</span>
            <div className='flex-1 h-px bg-slate-800'></div>
          </div>

          {/* TEMP — test accounts. Removed before public launch. */}
          <div className='mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-[10px] font-bold uppercase tracking-widest text-amber-300'>
                Test accounts (QA only)
              </span>
              <span className='text-[9px] text-amber-300/60'>tap to autofill</span>
            </div>
            <div className='space-y-1.5'>
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type='button'
                  onClick={() => setFormData({ email: acc.email, password: acc.password })}
                  className='w-full group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-colors'
                >
                  <div className='min-w-0'>
                    <div className='text-[11px] font-semibold text-white truncate'>{acc.label}</div>
                    <div className='text-[10px] text-gray-400 font-mono truncate'>{acc.email}</div>
                  </div>
                  <FiCopy size={10} className='shrink-0 text-gray-500 group-hover:text-amber-300' />
                </button>
              ))}
            </div>
          </div>

          {/* Sign Up Link */}
          <p className='text-center text-gray-400 text-xs'>
            Don't have an account?{' '}
            <Link href='/register' className='text-blue-400 hover:text-blue-300 font-medium transition-colors'>
              Create account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side — luxury sneaker backdrop with overlay */}
      <div className='hidden lg:flex flex-1 relative items-center justify-center p-8 overflow-hidden'>
        <img
          src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=2000&q=85'
          alt=''
          className='absolute inset-0 w-full h-full object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/70 to-slate-950/50' />
        <div className='relative z-10 text-center text-white'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className='max-w-sm mx-auto'
          >
            <div className='inline-flex items-center gap-1.5 px-3 py-1 mb-5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[10px] font-bold uppercase tracking-widest'>
              <span className='w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse' />
              Khaleeji Luxury · Now in Egypt
            </div>
            <h2 className='text-3xl font-bold mb-3 leading-tight'>
              Discover Unique Pieces
            </h2>
            <p className='text-sm text-gray-200/90 leading-relaxed'>
              Every pair is one of one in our boutique. Join thousands of collectors finding one-of-a-kind pairs every day.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
