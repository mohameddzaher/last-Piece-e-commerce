
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowRight, FiCheck } from 'react-icons/fi';
import { authAPI } from '@/utils/endpoints';
import { useAuthStore } from '@/store';
import { toast } from 'react-toastify';

export default function Register() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.register(formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Account created successfully!');
        router.push('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Too short', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Weak', color: 'bg-orange-500' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 3, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const { strength, label, color } = passwordStrength();

  return (
    <div className='min-h-screen bg-slate-950 flex'>
      {/* Left Side - Image/Design */}
      <div className='hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 items-center justify-center p-8'>
        <div className='text-center text-white'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className='text-6xl mb-6'>🌟</div>
            <h2 className='text-2xl font-bold mb-3'>Join Our Community</h2>
            <p className='text-sm text-white/80 max-w-xs'>
              Create an account and start collecting unique pieces today
            </p>

            {/* Features */}
            <div className='mt-8 space-y-3 text-left max-w-xs mx-auto'>
              {[
                'Access to exclusive collections',
                'Track your orders in real-time',
                'Save items to your wishlist',
                'Get notified about new arrivals',
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className='flex items-center gap-2'
                >
                  <div className='w-5 h-5 bg-white/20 rounded-full flex items-center justify-center'>
                    <FiCheck size={12} />
                  </div>
                  <span className='text-xs text-white/90'>{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
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

          <h1 className='text-xl font-bold text-white mb-1'>Create account</h1>
          <p className='text-gray-400 text-xs mb-6'>Fill in your details to get started</p>

          <form onSubmit={handleSubmit} className='space-y-3'>
            {/* Name Fields */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-gray-300 mb-1.5'>First Name</label>
                <div className='relative'>
                  <FiUser className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' size={14} />
                  <input
                    type='text'
                    name='firstName'
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className='w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                    placeholder='John'
                  />
                </div>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-300 mb-1.5'>Last Name</label>
                <div className='relative'>
                  <FiUser className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' size={14} />
                  <input
                    type='text'
                    name='lastName'
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className='w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                    placeholder='Doe'
                  />
                </div>
              </div>
            </div>

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
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className='mt-1.5'>
                  <div className='flex gap-1 mb-1'>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${level <= strength ? color : 'bg-slate-700'}`}
                      />
                    ))}
                  </div>
                  <p className='text-[10px] text-gray-500'>{label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className='block text-xs font-medium text-gray-300 mb-1.5'>Confirm Password</label>
              <div className='relative'>
                <FiLock className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' size={14} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500'
                      : 'border-slate-800'
                  }`}
                  placeholder='••••••••'
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className='text-[10px] text-red-400 mt-1'>Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading || (formData.confirmPassword && formData.password !== formData.confirmPassword)}
              className='w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4'
            >
              {loading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className='text-[10px] text-gray-500 text-center mt-4'>
            By creating an account, you agree to our{' '}
            <Link href='/terms' className='text-blue-400 hover:underline'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='text-blue-400 hover:underline'>
              Privacy Policy
            </Link>
          </p>

          {/* Sign In Link */}
          <p className='text-center text-gray-400 text-xs mt-6'>
            Already have an account?{' '}
            <Link href='/login' className='text-blue-400 hover:text-blue-300 font-medium transition-colors'>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
