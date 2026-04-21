'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
// AnimatePresence used in HomeFaqRow below
import { toast } from 'react-toastify';
import {
  FiArrowRight, FiTruck, FiShield, FiAward, FiStar, FiPackage,
  FiGlobe, FiZap, FiEdit3, FiX, FiSend, FiChevronDown,
} from 'react-icons/fi';
import SEO from '@/components/SEO';
import ProductCard from '@/components/ProductCard';
import { productAPI, reviewAPI, brandAPI, categoryAPI } from '@/utils/endpoints';
import { useAuthStore } from '@/store';
import { useSocketEvent } from '@/utils/socket';
import { useI18n } from '@/utils/i18n';
import { useSiteContent, pick } from '@/utils/useSiteContent';

const STATIC_CATEGORIES = [
  { name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80' },
  { name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80' },
  { name: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&q=80' },
  { name: 'Limited Edition', slug: 'limited', image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&q=80' },
];

const DEFAULT_HOME_FAQS = [
  {
    question: 'Are all sneakers 100% authentic?',
    answer: 'Yes. Every pair is authenticated by hand by our team in Riyadh and Cairo before it goes on sale.',
  },
  {
    question: 'What makes Last Piece unique?',
    answer: 'Every pair we carry is one-of-one in our inventory. We don’t restock. When you buy a pair, you’re buying the only one we have — you won’t find it anywhere else.',
  },
  {
    question: 'Where do you deliver?',
    answer: 'Anywhere in Cairo within 1-2 working days. Other Egyptian governorates within 2-4 days. KSA and GCC — contact us on WhatsApp.',
  },
  {
    question: 'Do you have physical branches?',
    answer: 'Yes. We have branches in Riyadh, Jeddah, and Cairo. Our Cairo branch also handles online orders and ships across Egypt.',
  },
  {
    question: 'What if a pair doesn’t fit?',
    answer: 'You have 7 days from delivery to return the pair. It must be in the exact condition we shipped it — unworn, original box.',
  },
  {
    question: 'Can I pay cash on delivery?',
    answer: 'Yes, across Egypt. In-branch we accept cash and card. Online we also accept Visa, Mastercard, and bank transfer.',
  },
];

function HomeFaqRow({ q, a, open, onToggle }) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-colors ${
        open ? 'border-blue-500/40 bg-slate-900' : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-900"
      >
        <span className="text-xs font-semibold text-white">{q}</span>
        <FiChevronDown
          size={12}
          className={`shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-0 text-xs text-gray-300 leading-relaxed whitespace-pre-line border-t border-slate-800 pt-3">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const t = useI18n((s) => s.t);
  const cms = useSiteContent();
  const hero = cms['home.hero'] || {};
  const catSec = cms['home.categorySection'] || {};
  const dropSec = cms['home.dropSection'] || {};
  const brandsSec = cms['home.brandsSection'] || {};
  const reviewsSec = cms['home.reviewsSection'] || {};
  const storySec = cms['home.storySection'] || {};
  const faqSec = cms['home.faq'] || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [openFaq, setOpenFaq] = useState(-1);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll({ limit: 8, page: 1 });
      if (res.data.success) setProducts(res.data.data || []);
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      const res = await reviewAPI.getFeatured();
      if (res.data.success) setReviews(res.data.data || []);
    } catch (e) { /* silent */ }
    finally { setReviewsLoading(false); }
  };

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    brandAPI.getAll({ featured: true, limit: 8 }).then((r) => setBrands(r.data.data || [])).catch(() => {});
    categoryAPI.getAll().then((r) => {
      const m = {};
      (r.data.data || []).forEach((c) => { m[c.slug] = c.productCount || 0; });
      setCategoryCounts(m);
    }).catch(() => {});
  }, []);

  useSocketEvent('product:created', fetchProducts);
  useSocketEvent('product:updated', fetchProducts);
  useSocketEvent('product:deleted', fetchProducts);
  useSocketEvent('review:created', fetchReviews);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return toast.error('Please write a review');
    try {
      setSubmitting(true);
      const res = await reviewAPI.create({
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        isStoreReview: true,
      });
      if (res.data.success) {
        toast.success('Review submitted');
        setReviewForm({ rating: 5, comment: '' });
        setShowReviewForm(false);
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const renderStarRating = (rating, interactive = false, onSelect = null) => (
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
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}
            size={interactive ? 20 : 12}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className='min-h-screen'>
      <SEO
        title={pick(hero, 'title', 'Last Piece — Luxury Sneakers')}
        description={pick(hero, 'subtitle', 'Authentic, limited, one-of-a-kind sneakers.')}
      />

      {/* ========== HERO (DARK, with faded sneaker backdrop) ==========
          `items-start + pt-6` instead of vertical-centering the content — this
          sits the headline right under the header instead of floating in the
          middle of the viewport with a big empty strip above. */}
      <section className='relative min-h-[62vh] flex items-start overflow-hidden bg-slate-950'>
        {/* Faded image backdrop — visible but subtle, works on mobile too */}
        <div className='absolute inset-0'>
          <Image
            src={pick(hero, 'image', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=2000&q=85')}
            alt=''
            fill
            priority
            sizes='100vw'
            className='object-cover opacity-25 md:opacity-20'
          />
          {/* Overlay that keeps text readable. Stronger tint on mobile so the
              image reads as a supporting texture, not competing for attention. */}
          <div className='absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-950/40 lg:from-slate-950/85 lg:via-slate-950/60 lg:to-slate-950/20' />
          <div className='absolute top-10 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-10 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:48px_48px]'></div>

        <div className='relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-10 md:pt-8 md:pb-12 w-full'>
          <div className='grid lg:grid-cols-2 gap-8 items-center'>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className='space-y-5'
            >
              <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full'>
                <FiZap className='text-blue-400' size={12} />
                <span className='text-blue-400 text-xs font-medium'>
                  {pick(hero, 'eyebrow', t('home.eyebrow', 'Khaleeji Luxury · Now in Egypt'))}
                </span>
              </div>

              <h1 className='text-3xl md:text-5xl font-bold text-white leading-tight'>
                {pick(hero, 'title') ? (
                  pick(hero, 'title')
                ) : (
                  <>
                    {t('home.heroTitleLead', 'Own The')}{' '}
                    <span className='text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text'>
                      {t('home.heroTitleAccent', 'Last Piece')}
                    </span>
                  </>
                )}
              </h1>

              <p className='text-sm text-gray-400 leading-relaxed max-w-lg'>
                {pick(hero, 'subtitle', t('home.heroSubtitle', 'Exclusive sneakers where every pair exists as only one.'))}
              </p>

              <div className='flex flex-col sm:flex-row gap-3'>
                <Link
                  href={pick(hero, 'ctaPrimary.href', '/products')}
                  className='group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold text-white transition-all duration-300 shadow-lg shadow-blue-500/25'
                >
                  {pick(hero, 'ctaPrimary.label', t('home.shopNow', 'Shop the Collection'))}
                  <FiArrowRight className='group-hover:translate-x-1 transition-transform rtl:rotate-180' size={14} />
                </Link>
                <Link
                  href={pick(hero, 'ctaSecondary.href', '/register')}
                  className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold text-white transition-all'
                >
                  {pick(hero, 'ctaSecondary.label', t('home.joinNow', 'Join Now'))}
                </Link>
              </div>

              <div className='flex flex-wrap gap-6 pt-5 border-t border-slate-800'>
                <div>
                  <div className='text-2xl font-bold text-white'>500+</div>
                  <div className='text-gray-500 text-xs'>{t('home.stats.uniquePairs', 'Unique Pairs')}</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>10K+</div>
                  <div className='text-gray-500 text-xs'>{t('home.stats.happyCustomers', 'Happy Customers')}</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>100%</div>
                  <div className='text-gray-500 text-xs'>{t('home.stats.authentic', 'Authentic')}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className='relative mt-4 lg:mt-0'
            >
              {/* Mobile: two cards stacked side-by-side, smaller.
                  Desktop: the original rotated floating layout. */}
              <div className='relative h-[260px] sm:h-[320px] lg:h-[400px]'>
                <div className='absolute top-0 right-0 w-40 sm:w-48 lg:w-56 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500'>
                  <div className='aspect-square bg-gradient-to-br from-blue-500/10 to-purple-500/10 relative'>
                    <Image
                      src={products[0]?.thumbnail || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80'}
                      alt='Featured'
                      fill
                      sizes='(max-width: 640px) 160px, (max-width: 1024px) 192px, 224px'
                      className='object-cover'
                    />
                    <div className='absolute top-2 left-2 px-2 py-0.5 bg-red-500 rounded text-white text-[10px] font-bold'>
                      {t('home.featureLastPiece', 'Last Piece!')}
                    </div>
                  </div>
                  <div className='p-3'>
                    <h3 className='text-white font-semibold text-sm truncate'>{products[0]?.name || 'Featured pair'}</h3>
                    <p className='text-gray-500 text-xs mt-0.5'>{products[0]?.size ? `Size ${products[0].size}` : '—'}</p>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-lg font-bold text-white'>
                        {products[0]?.price ? `${products[0].sellingCurrency || 'EGP'} ${products[0].price.toLocaleString()}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='absolute bottom-0 left-0 w-36 sm:w-44 lg:w-48 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500'>
                  <div className='aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 relative'>
                    <Image
                      src={products[1]?.thumbnail || 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&q=80'}
                      alt='Featured'
                      fill
                      sizes='(max-width: 640px) 144px, (max-width: 1024px) 176px, 192px'
                      className='object-cover'
                    />
                    <div className='absolute top-2 left-2 px-2 py-0.5 bg-purple-500 rounded text-white text-[10px] font-bold'>
                      {t('home.featureExclusive', 'Exclusive')}
                    </div>
                  </div>
                  <div className='p-3'>
                    <h3 className='text-white font-semibold text-xs truncate'>{products[1]?.name || 'Second pair'}</h3>
                    <p className='text-gray-500 text-[10px] mt-0.5'>{products[1]?.size ? `Size ${products[1].size}` : '—'}</p>
                    <span className='text-sm font-bold text-white'>
                      {products[1]?.price ? `${products[1].sellingCurrency || 'EGP'} ${products[1].price.toLocaleString()}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES STRIP (WHITE) ========== */}
      <section className='py-10 bg-white'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[
              { icon: FiPackage, title: t('home.features.oneOfOne.title', 'One of One'), desc: t('home.features.oneOfOne.desc', 'Every pair is unique — never restocked'), color: 'text-blue-600', bg: 'bg-blue-500/10' },
              { icon: FiShield, title: t('home.features.authenticated.title', 'Authenticated'), desc: t('home.features.authenticated.desc', 'Verified by hand, every time'), color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
              { icon: FiTruck, title: t('home.features.delivery.title', 'Delivery in Cairo'), desc: t('home.features.delivery.desc', 'Everywhere in Cairo & across Egypt'), color: 'text-purple-600', bg: 'bg-purple-500/10' },
              { icon: FiGlobe, title: t('home.features.khaleej.title', 'Khaleej + Cairo'), desc: t('home.features.khaleej.desc', 'Branches in Riyadh, Jeddah, Cairo'), color: 'text-amber-600', bg: 'bg-amber-500/10' },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className='p-4 bg-slate-50 border border-slate-200 rounded-lg'
              >
                <div className={`w-8 h-8 ${feature.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <feature.icon className={feature.color} size={16} />
                </div>
                <h3 className='text-sm font-semibold text-slate-900 mb-0.5'>{feature.title}</h3>
                <p className='text-slate-500 text-xs'>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CATEGORIES (WHITE) ========== */}
      <section className='py-12 bg-white text-slate-900'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='text-center mb-8'>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className='text-2xl font-bold mb-2'
            >
              {pick(catSec, 'heading', t('home.shopByCategory', 'Shop by Category'))}
            </motion.h2>
            <p className='text-gray-500 text-xs'>
              {pick(catSec, 'subtitle', t('home.categorySubtitle', 'Find your perfect unique pair'))}
            </p>
          </div>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {STATIC_CATEGORIES.map((cat, idx) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href={cat.slug === 'limited' ? '/products?sort=-createdAt' : `/products?category=${cat.slug}`}
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
                    <h3 className='text-sm font-bold text-white mb-0.5'>
                      {t(`nav.${cat.slug}`, cat.name)}
                    </h3>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-300 text-xs'>{categoryCounts[cat.slug] ?? '—'} pairs</span>
                      <FiArrowRight className='text-white text-xs opacity-0 group-hover:opacity-100 transition-all' size={12} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BRANDS TICKER (DARK) ========== */}
      {brands.length > 0 && (
        <section className='py-12 bg-slate-950 overflow-hidden'>
          <div className='max-w-7xl mx-auto px-4 mb-8'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-white mb-2'>
                {pick(brandsSec, 'heading', t('home.brandsHeading', 'The Houses We Carry'))}
              </h2>
              <p className='text-gray-400 text-xs'>
                {pick(brandsSec, 'subtitle', t('home.brandsSubtitle', 'Only the best. Nothing less.'))}
              </p>
            </div>
          </div>

          {/* Marquee — duplicate the set so the animation loops seamlessly */}
          <div className='relative'>
            <div
              className='absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none'
              style={{ background: 'linear-gradient(to right, #020617, transparent)' }}
            />
            <div
              className='absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none'
              style={{ background: 'linear-gradient(to left, #020617, transparent)' }}
            />
            <div className='flex gap-6 animate-brand-scroll' style={{ width: 'max-content' }}>
              {[...brands, ...brands, ...brands].map((b, i) => (
                <Link
                  key={`${b._id}-${i}`}
                  href={`/products?brand=${b.slug}`}
                  className='shrink-0 w-40 h-24 flex items-center justify-center rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all group'
                >
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} className='max-w-[70%] max-h-[60%] object-contain opacity-60 group-hover:opacity-100 transition-opacity' />
                  ) : (
                    <span className='text-base font-bold tracking-wider text-gray-300 group-hover:text-white uppercase'>{b.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== LATEST DROPS (WHITE) ========== */}
      <section className='py-12 bg-slate-50 text-slate-900'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8'>
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className='text-2xl font-bold mb-1'
              >
                {pick(dropSec, 'heading', t('home.latestDrops', 'Latest Drops'))}
              </motion.h2>
              <p className='text-gray-500 text-xs'>
                {pick(dropSec, 'subtitle', t('home.latestDropsSubtitle', 'Fresh unique pairs just added'))}
              </p>
            </div>
            <Link href='/products' className='group flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'>
              {t('home.viewAll', 'View All')}
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
              <FiPackage className='mx-auto text-gray-400 mb-3' size={32} />
              <h3 className='text-base font-bold mb-1'>{t('home.noProducts', 'No products yet')}</h3>
              <p className='text-gray-500 text-xs'>{t('home.checkBackSoon', 'Check back soon for new drops')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== STORY STRIP (DARK, image of Cairo on left) ========== */}
      <section className='bg-slate-950 text-white overflow-hidden'>
        <div className='max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0'>
          <div className='relative aspect-[4/3] md:aspect-auto md:min-h-[420px]'>
            <Image
              src={pick(storySec, 'image', 'https://i.pinimg.com/736x/63/16/fd/6316fdb78b7ef9bc81b88753f9098177.jpg')}
              alt='Our story'
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 50vw'
            />
            <div className='absolute inset-0 bg-gradient-to-r md:bg-gradient-to-l from-slate-950/50 via-transparent to-transparent' />
          </div>
          <div className='p-8 md:p-14 flex flex-col justify-center'>
            <div className='text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3'>
              {pick(storySec, 'eyebrow', t('home.story.eyebrow', 'Our Story'))}
            </div>
            <h2 className='text-2xl md:text-3xl font-bold mb-4 leading-tight'>
              {pick(storySec, 'title', 'Born in the Khaleej. Curated for Cairo.')}
            </h2>
            <p className='text-sm text-gray-300 leading-relaxed mb-5'>
              {pick(storySec, 'body', 'Last Piece started as a private collection in Riyadh. Today, we bring those same standards to Egypt — every pair authenticated, every drop limited, every box opened with intent.')}
            </p>
            <Link href='/about' className='inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300'>
              {t('home.story.readMore', 'Read more')} <FiArrowRight size={14} className='rtl:rotate-180' />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== REVIEWS (WHITE) ========== */}
      <section className='py-12 bg-white text-slate-900'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8'>
            <div className='text-center md:text-left'>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className='text-2xl font-bold mb-2'
              >
                {pick(reviewsSec, 'heading', t('home.customerReviews', 'What Customers Say'))}
              </motion.h2>
              <p className='text-gray-500 text-xs'>
                {pick(reviewsSec, 'subtitle', t('home.reviewsSubtitle', 'Real owners. Real pairs.'))}
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className='flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors'
              >
                <FiEdit3 size={16} />
                {t('home.writeReview', 'Write a Review')}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-8 overflow-hidden'
              >
                <form onSubmit={handleSubmitReview} className='p-6 bg-slate-50 border border-slate-200 rounded-xl'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold'>{t('home.shareExperience', 'Share your experience')}</h3>
                    <button
                      type='button'
                      onClick={() => setShowReviewForm(false)}
                      className='text-gray-500 hover:text-slate-900'
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  <div className='mb-4'>
                    <label className='block text-sm text-gray-500 mb-2'>{t('home.yourRating', 'Your rating')}</label>
                    {renderStarRating(reviewForm.rating, true, (star) => setReviewForm({ ...reviewForm, rating: star }))}
                  </div>
                  <div className='mb-4'>
                    <label className='block text-sm text-gray-500 mb-2'>{t('home.yourReview', 'Your review')}</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder={t('home.reviewPlaceholder', 'Tell us about your experience with Last Piece...')}
                      className='w-full px-4 py-3 bg-white border border-slate-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                      rows={4}
                    />
                  </div>
                  <button
                    type='submit'
                    disabled={submitting}
                    className='flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium w-full sm:w-auto'
                  >
                    {submitting ? (
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <>
                        <FiSend size={16} /> {t('home.submitReview', 'Submit Review')}
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

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
                  className='p-4 bg-slate-50 border border-slate-200 rounded-xl'
                >
                  <div className='flex gap-0.5 mb-3'>
                    {[...Array(review.rating)].map((_, i) => (
                      <FiStar key={i} className='text-yellow-500 fill-yellow-500' size={12} />
                    ))}
                  </div>
                  <p className='text-gray-700 text-xs mb-4 leading-relaxed'>"{review.comment}"</p>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                      <span className='text-white font-bold text-xs'>
                        {review.userId?.firstName?.[0]}{review.userId?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className='font-semibold text-xs'>
                        {review.userId?.firstName} {review.userId?.lastName?.[0]}.
                      </h4>
                      <p className='text-gray-500 text-[10px]'>
                        {review.verified ? t('home.verifiedCustomer', 'Verified Customer') : t('home.customer', 'Customer')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12 bg-slate-50 border border-slate-200 rounded-xl'>
              <FiStar className='mx-auto text-gray-400 mb-3' size={32} />
              <h3 className='text-base font-bold mb-1'>No reviews yet</h3>
              <p className='text-gray-500 text-xs mb-4'>{t('home.beFirstToReview', 'Be the first to share your experience!')}</p>
              {!isAuthenticated && (
                <Link
                  href='/login'
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium'
                >
                  {t('home.loginToReview', 'Login to Write a Review')}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========== FAQ (DARK) ========== */}
      <section className="bg-slate-950 text-white border-y border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <div className="text-center mb-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-1">
              {pick(faqSec, 'eyebrow', 'FAQ')}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {pick(faqSec, 'heading', t('home.faq.heading', 'Your questions, answered'))}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {pick(faqSec, 'subtitle', t('home.faq.subtitle', 'Before you ask — here are the ones our customers ask most.'))}
            </p>
          </div>
          <div className="space-y-2">
            {(pick(faqSec, 'items', DEFAULT_HOME_FAQS)).map((f, i) => (
              <HomeFaqRow
                key={i}
                q={f.question}
                a={f.answer}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
          <div className="mt-6 text-center text-[11px] text-gray-500">
            {t('home.faq.stillHaveQuestion', 'Still have a question?')} <Link href="/contact" className="text-blue-400 hover:underline">{t('home.faq.talkToUs', 'Talk to us')}</Link>.
          </div>
        </div>
      </section>

      {/* ========== CTA BAND (WHITE) ========== */}
      <section className='py-16 bg-white'>
        <div className='max-w-6xl mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='relative overflow-hidden rounded-3xl min-h-[360px] flex items-center'
          >
            <Image
              src='https://images.unsplash.com/photo-1552346154-21d32810aba3?w=2000&q=85'
              alt=''
              fill
              className='object-cover object-center'
              sizes='100vw'
            />
            <div className='absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/30' />
            <div className='relative z-10 px-8 md:px-14 py-12 max-w-xl'>
              <div className='text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3'>
                {t('home.cta.joinList', 'JOIN THE LIST')}
              </div>
              <h2 className='text-3xl md:text-4xl font-bold text-white mb-4 leading-tight'>
                {t('home.cta.heading', 'Start Your Collection Today')}
              </h2>
              <p className='text-sm text-gray-200 mb-6 leading-relaxed'>
                {t('home.cta.subtitle', 'Every pair is one of a kind. Be the first to know when rare pairs drop.')}
              </p>
              <div className='flex flex-col sm:flex-row gap-3'>
                <Link
                  href='/products'
                  className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors'
                >
                  {t('home.cta.shopCollection', 'Shop Collection')}
                  <FiArrowRight size={14} className='rtl:rotate-180' />
                </Link>
                <Link
                  href='/register'
                  className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white rounded-lg text-sm font-semibold transition-colors'
                >
                  {t('home.cta.createAccount', 'Create Account')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== NEWSLETTER (WHITE) ========== */}
      <section className='py-12 bg-white border-t border-slate-200'>
        <div className='max-w-2xl mx-auto px-4 text-center'>
          <FiAward className='mx-auto text-amber-500 mb-3' size={28} />
          <h2 className='text-xl font-bold text-slate-900 mb-1.5'>
            {t('home.newsletter', 'Get Early Access')}
          </h2>
          <p className='text-slate-500 text-xs mb-5'>
            {t('home.newsletterSub', 'Be the first to know when rare pairs drop')}
          </p>
          <form className='flex flex-col sm:flex-row gap-2 max-w-md mx-auto' onSubmit={(e) => e.preventDefault()}>
            <input
              type='email'
              placeholder={t('home.newsletterPlaceholder', 'your@email.com')}
              className='flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900'
            />
            <button
              type='submit'
              className='h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold'
            >
              {t('home.subscribe', 'Subscribe')}
            </button>
          </form>
          <p className='text-slate-400 text-[10px] mt-2'>{t('home.noSpam', 'No spam. Unsubscribe anytime.')}</p>
        </div>
      </section>
    </div>
  );
}
