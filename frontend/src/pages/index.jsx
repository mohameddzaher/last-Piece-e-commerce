
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import { productAPI, reviewAPI } from '@/utils/endpoints';
import { useAuthStore } from '@/store';
import { toast } from 'react-toastify';
import {
  FiArrowRight,
  FiTruck,
  FiShield,
  FiAward,
  FiStar,
  FiPackage,
  FiGlobe,
  FiZap,
  FiEdit3,
  FiX,
  FiSend,
} from 'react-icons/fi';

// Shoe categories
const categories = [
  {
    name: 'Sneakers',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&q=80',
    count: '50+',
  },
  {
    name: 'Running',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    count: '30+',
  },
  {
    name: 'Casual',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80',
    count: '40+',
  },
  {
    name: 'Limited Edition',
    image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&q=80',
    count: '20+',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll({ limit: 8, page: 1 });
      if (res.data.success) {
        setProducts(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await reviewAPI.getFeatured();
      if (res.data.success) {
        setReviews(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setSubmitting(true);
      const res = await reviewAPI.create({
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        isStoreReview: true,
      });
      if (res.data.success) {
        toast.success('Review submitted successfully!');
        setReviewForm({ rating: 5, comment: '' });
        setShowReviewForm(false);
        fetchReviews(); // Refresh reviews list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (rating, interactive = false, onSelect = null) => {
    return (
      <div className='flex gap-0.5'>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onSelect(star) : undefined}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            disabled={!interactive}
          >
            <FiStar
              className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
              size={interactive ? 20 : 12}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Hero Section */}
      <section className='relative min-h-[70vh] flex items-center overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0'>
          <div className='absolute top-10 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-10 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>

        {/* Grid Pattern */}
        <div className='absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:48px_48px]'></div>

        <div className='relative z-10 max-w-7xl mx-auto px-4 py-12'>
          <div className='grid lg:grid-cols-2 gap-8 items-center'>
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className='space-y-5'
            >
              <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full'>
                <FiZap className='text-blue-400' size={12} />
                <span className='text-blue-400 text-xs font-medium'>One Pair Only - No Duplicates</span>
              </div>

              <h1 className='text-3xl md:text-5xl font-bold text-white leading-tight'>
                Own The{' '}
                <span className='text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text'>
                  Last Piece
                </span>
              </h1>

              <p className='text-sm text-gray-400 leading-relaxed max-w-lg'>
                Exclusive sneakers where every pair exists as only one. Rare kicks, limited editions,
                and unique finds that can never be replicated.
              </p>

              <div className='flex flex-col sm:flex-row gap-3'>
                <Link
                  href='/products'
                  className='group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold text-white transition-all duration-300 shadow-lg shadow-blue-500/25'
                >
                  Shop Now
                  <FiArrowRight className='group-hover:translate-x-1 transition-transform' size={14} />
                </Link>
                <Link
                  href='/register'
                  className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold text-white transition-all'
                >
                  Join Now
                </Link>
              </div>

              {/* Stats */}
              <div className='flex flex-wrap gap-6 pt-5 border-t border-slate-800'>
                <div>
                  <div className='text-2xl font-bold text-white'>500+</div>
                  <div className='text-gray-500 text-xs'>Unique Pairs</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>10K+</div>
                  <div className='text-gray-500 text-xs'>Happy Customers</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>100%</div>
                  <div className='text-gray-500 text-xs'>Authentic</div>
                </div>
              </div>
            </motion.div>

            {/* Right - Featured Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='relative hidden lg:block'
            >
              <div className='relative h-[400px]'>
                {/* Main Card */}
                <div className='absolute top-0 right-0 w-56 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500'>
                  <div className='aspect-square bg-gradient-to-br from-blue-500/10 to-purple-500/10 relative'>
                    <Image
                      src='https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80'
                      alt='Featured Sneaker'
                      fill
                      className='object-cover'
                    />
                    <div className='absolute top-2 left-2 px-2 py-0.5 bg-red-500 rounded text-white text-[10px] font-bold'>
                      Last Piece!
                    </div>
                  </div>
                  <div className='p-3'>
                    <h3 className='text-white font-semibold text-sm'>Air Max Limited</h3>
                    <p className='text-gray-500 text-xs mt-0.5'>Size 42 EU</p>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-lg font-bold text-white'>$299</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Card */}
                <div className='absolute bottom-0 left-0 w-48 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500'>
                  <div className='aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 relative'>
                    <Image
                      src='https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&q=80'
                      alt='Featured Sneaker'
                      fill
                      className='object-cover'
                    />
                    <div className='absolute top-2 left-2 px-2 py-0.5 bg-purple-500 rounded text-white text-[10px] font-bold'>
                      Exclusive
                    </div>
                  </div>
                  <div className='p-3'>
                    <h3 className='text-white font-semibold text-xs'>Jordan Retro</h3>
                    <p className='text-gray-500 text-[10px] mt-0.5'>Size 44 EU</p>
                    <span className='text-sm font-bold text-white'>$449</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-10 bg-slate-900/50'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[
              { icon: FiPackage, title: 'One of One', desc: 'Every pair is unique', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: FiShield, title: 'Authenticated', desc: '100% verified genuine', color: 'text-green-400', bg: 'bg-green-500/10' },
              { icon: FiTruck, title: 'Fast Shipping', desc: 'Secure delivery', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: FiGlobe, title: 'Worldwide', desc: 'Ship anywhere', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className='p-4 bg-slate-900 border border-slate-800 rounded-lg'
              >
                <div className={`w-8 h-8 ${feature.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <feature.icon className={feature.color} size={16} />
                </div>
                <h3 className='text-sm font-semibold text-white mb-0.5'>{feature.title}</h3>
                <p className='text-gray-500 text-xs'>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className='py-12'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='text-center mb-8'>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className='text-2xl font-bold text-white mb-2'
            >
              Shop by Category
            </motion.h2>
            <p className='text-gray-400 text-xs'>Find your perfect unique pair</p>
          </div>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href={`/products?category=${cat.name.toLowerCase()}`}
                  className='group block relative h-40 rounded-xl overflow-hidden'
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className='object-cover group-hover:scale-110 transition-transform duration-500'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent'></div>
                  <div className='absolute bottom-0 left-0 right-0 p-4'>
                    <h3 className='text-sm font-bold text-white mb-0.5'>{cat.name}</h3>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-400 text-xs'>{cat.count} pairs</span>
                      <FiArrowRight className='text-white text-xs opacity-0 group-hover:opacity-100 transition-all' size={12} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className='py-12 bg-slate-900/30'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8'>
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className='text-2xl font-bold text-white mb-1'
              >
                Latest Drops
              </motion.h2>
              <p className='text-gray-400 text-xs'>Fresh unique pairs just added</p>
            </div>
            <Link
              href='/products'
              className='group flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors'
            >
              View All
              <FiArrowRight className='group-hover:translate-x-1 transition-transform' size={14} />
            </Link>
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : products.length > 0 ? (
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
              {products.map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <FiPackage className='mx-auto text-gray-600 mb-3' size={32} />
              <h3 className='text-base font-bold text-white mb-1'>No products yet</h3>
              <p className='text-gray-400 text-xs'>Check back soon for new drops</p>
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className='py-12'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8'>
            <div className='text-center md:text-left'>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className='text-2xl font-bold text-white mb-2'
              >
                What Sneakerheads Say
              </motion.h2>
              <p className='text-gray-400 text-xs'>Join our community of collectors</p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors'
              >
                <FiEdit3 size={16} />
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-8 overflow-hidden'
              >
                <form onSubmit={handleSubmitReview} className='p-6 bg-slate-900 border border-slate-800 rounded-xl'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-white'>Share Your Experience</h3>
                    <button
                      type='button'
                      onClick={() => setShowReviewForm(false)}
                      className='text-gray-400 hover:text-white'
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  <div className='mb-4'>
                    <label className='block text-sm text-gray-400 mb-2'>Your Rating</label>
                    {renderStarRating(reviewForm.rating, true, (star) => setReviewForm({ ...reviewForm, rating: star }))}
                  </div>

                  <div className='mb-4'>
                    <label className='block text-sm text-gray-400 mb-2'>Your Review</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder='Tell us about your experience with Last Piece...'
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                      rows={4}
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={submitting}
                    className='flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors w-full sm:w-auto'
                  >
                    {submitting ? (
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <>
                        <FiSend size={16} />
                        Submit Review
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews Grid */}
          {reviewsLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {reviews.map((review, idx) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className='p-4 bg-slate-900 border border-slate-800 rounded-xl'
                >
                  <div className='flex gap-0.5 mb-3'>
                    {[...Array(review.rating)].map((_, i) => (
                      <FiStar key={i} className='text-yellow-400 fill-yellow-400' size={12} />
                    ))}
                  </div>
                  <p className='text-gray-300 text-xs mb-4 leading-relaxed'>"{review.comment}"</p>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                      <span className='text-white font-bold text-xs'>
                        {review.userId?.firstName?.[0]}{review.userId?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className='font-semibold text-white text-xs'>
                        {review.userId?.firstName} {review.userId?.lastName?.[0]}.
                      </h4>
                      <p className='text-gray-500 text-[10px]'>Verified Customer</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12 bg-slate-900 border border-slate-800 rounded-xl'>
              <FiStar className='mx-auto text-gray-600 mb-3' size={32} />
              <h3 className='text-base font-bold text-white mb-1'>No reviews yet</h3>
              <p className='text-gray-400 text-xs mb-4'>Be the first to share your experience!</p>
              {!isAuthenticated && (
                <Link
                  href='/login'
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors'
                >
                  Login to Write a Review
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-12'>
        <div className='max-w-4xl mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='relative overflow-hidden rounded-2xl'
          >
            <div className='absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'></div>
            <div className='relative z-10 px-6 py-10 md:px-12 text-center'>
              <h2 className='text-2xl md:text-3xl font-bold text-white mb-3'>
                Start Your Collection Today
              </h2>
              <p className='text-sm text-white/80 mb-6 max-w-lg mx-auto'>
                Join our community and discover unique sneakers. Every pair is one of a kind.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Link
                  href='/products'
                  className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-all'
                >
                  Shop Collection
                  <FiArrowRight size={14} />
                </Link>
                <Link
                  href='/register'
                  className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-semibold transition-all'
                >
                  Create Account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className='py-12 border-t border-slate-800'>
        <div className='max-w-2xl mx-auto px-4 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <FiAward className='mx-auto text-blue-400 mb-4' size={32} />
            <h2 className='text-xl font-bold text-white mb-2'>
              Get Early Access
            </h2>
            <p className='text-gray-400 text-xs mb-6'>
              Be the first to know when rare pairs drop
            </p>
            <form className='flex flex-col sm:flex-row gap-3 max-w-md mx-auto'>
              <input
                type='email'
                placeholder='Enter your email'
                className='flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <button
                type='submit'
                className='px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors'
              >
                Subscribe
              </button>
            </form>
            <p className='text-gray-600 text-[10px] mt-3'>
              No spam, unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
