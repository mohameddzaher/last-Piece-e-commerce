
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { authAPI } from '@/utils/endpoints';
import { useAuthStore } from '@/store';
import { toast } from 'react-toastify';

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

          {/* Demo Accounts */}
          <div className='bg-slate-900/50 border border-slate-800 rounded-lg p-3 mb-5'>
            <p className='text-xs text-gray-400 mb-2'>Demo Accounts:</p>
            <div className='space-y-1.5 text-xs'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Admin:</span>
                <span className='text-gray-300'>admin@lastpiece.com / Admin@12345</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>User:</span>
                <span className='text-gray-300'>user@lastpiece.com / User@12345</span>
              </div>
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

      {/* Right Side - Image/Design */}
      <div className='hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 items-center justify-center p-8'>
        <div className='text-center text-white'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className='text-6xl mb-6'>✨</div>
            <h2 className='text-2xl font-bold mb-3'>Discover Unique Pieces</h2>
            <p className='text-sm text-white/80 max-w-xs'>
              Join thousands of collectors finding one-of-a-kind items every day
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
