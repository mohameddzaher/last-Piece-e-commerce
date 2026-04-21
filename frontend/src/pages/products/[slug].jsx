'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  FiHeart, FiShoppingCart, FiShield, FiTruck, FiStar, FiCheckCircle,
  FiHome, FiShare2, FiMinus, FiPlus, FiChevronDown, FiAward,
} from 'react-icons/fi';
import SEO from '@/components/SEO';
import ProductCard from '@/components/ProductCard';
import { productAPI, reviewAPI, cartAPI, wishlistAPI, orderAPI } from '@/utils/endpoints';
import { useAuthStore, useCartStore, useWishlistStore } from '@/store';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtDate } from '@/utils/format';
import { getProductImageUrl } from '@/utils/formatters';
import { useRecentlyViewed } from '@/utils/useRecentlyViewed';
import { useI18n } from '@/utils/i18n';

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { isAuthenticated } = useAuthStore();
  const t = useI18n((s) => s.t);
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addWish, removeItem: removeWish } = useWishlistStore();
  const { ids: recentIds, push: pushRecent } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [related, setRelated] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [qty, setQty] = useState(1);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const r = await productAPI.getBySlug(slug);
      setProduct(r.data.data);
    } catch {
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [slug]);

  useEffect(() => { if (product?._id) pushRecent(product._id); }, [product?._id, pushRecent]);

  useEffect(() => {
    if (!product?._id) return;
    productAPI.getRelated(product._id, 4).then((r) => setRelated(r.data.data || [])).catch(() => {});
    reviewAPI.getProductReviews(product._id).then((r) => setReviews(r.data.data || [])).catch(() => {});
    if (isAuthenticated) {
      orderAPI.getAll({ limit: 100 }).then((r) => {
        const purchased = (r.data.data || []).some((o) =>
          (o.items || []).some((it) => String(it.productId) === String(product._id)) &&
          ['delivered', 'completed'].includes(o.status),
        );
        setHasPurchased(purchased);
      }).catch(() => {});
    }
  }, [product?._id, isAuthenticated]);

  useEffect(() => {
    const ids = recentIds.filter((id) => id !== product?._id).slice(0, 8);
    if (ids.length === 0) { setRecentlyViewed([]); return; }
    Promise.all(
      ids.map((id) => productAPI.getBySlug(id).then((r) => r.data.data).catch(() => null)),
    ).then((arr) => setRecentlyViewed(arr.filter(Boolean)));
  }, [recentIds, product?._id]);

  useSocketEvent('product:updated', (p) => {
    if (p?._id === product?._id) setProduct(p);
  });
  useSocketEvent('review:created', (r) => {
    if (r?.productId && String(r.productId) === String(product?._id)) {
      setReviews((prev) => [r, ...prev]);
    }
  });

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-2 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-6 w-3/4 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
            <div className="h-9 w-32 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center py-16">
          <p className="text-sm text-slate-500">{t('product.notFound', 'Product not found.')}</p>
          <Link href="/products" className="mt-2 inline-block text-xs text-blue-600 font-semibold">{t('product.backToProducts', 'Back to products')}</Link>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlistItems?.some((i) => i.productId === product._id);
  const images = product.images?.length > 0 ? product.images : product.thumbnail ? [{ url: product.thumbnail }] : [];
  const soldOut = product.location === 'sold' || product.stock === 0 || !product.isAvailable;
  const currency = product.sellingCurrency || 'EGP';
  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;
  const productFaqs = product.faqs?.filter((f) => f.question) || [];

  const handleAddToCart = async () => {
    try {
      if (isAuthenticated) await cartAPI.add({ productId: product._id, quantity: qty });
      addItem({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: getProductImageUrl(product.thumbnail || product.images?.[0]?.url),
        quantity: qty,
      });
      toast.success(`Added to cart · ${qty}`);
    } catch {
      toast.error('Failed');
    }
  };

  const toggleWishlist = async () => {
    try {
      if (isWishlisted) {
        if (isAuthenticated) await wishlistAPI.remove({ productId: product._id });
        removeWish(product._id);
        toast.info('Removed from wishlist');
      } else {
        if (isAuthenticated) await wishlistAPI.add({ productId: product._id });
        addWish({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: getProductImageUrl(product.thumbnail),
        });
        toast.success('Saved to wishlist');
      }
    } catch {
      toast.error('Failed');
    }
  };

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.warn('Please sign in to review.');
    try {
      setSubmittingReview(true);
      await reviewAPI.create({ productId: product._id, ...reviewForm });
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Thanks for your review!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
      <SEO
        title={`${product.name} · Last Piece`}
        description={product.shortDescription || product.description?.slice(0, 160)}
        image={images[0]?.url}
      />

      {/* Breadcrumb (white, compact) */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-9 flex items-center gap-1 text-[10px] text-slate-500">
          <Link href="/" className="hover:text-slate-900 inline-flex items-center gap-1">
            <FiHome size={9} /> {t('nav.home', 'Home')}
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-slate-900">{t('nav.products', 'Products')}</Link>
          {product.category?.name && (
            <>
              <span>/</span>
              <Link href={`/products?category=${product.category.slug || ''}`} className="hover:text-slate-900">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-900 truncate max-w-[180px]">{product.name}</span>
        </div>
      </nav>

      {/* MAIN (white, compact) */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">
          {/* GALLERY */}
          <div className="space-y-2">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 max-w-[460px] mx-auto lg:mx-0">
              {images[activeImage]?.url && (
                <Image
                  src={getProductImageUrl(images[activeImage].url)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 90vw, 460px"
                  className="object-cover"
                  priority
                />
              )}
              {discount > 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[9px] font-bold tracking-wider uppercase rounded">
                  −{discount}%
                </span>
              )}
              {product.stock === 1 && !soldOut && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-slate-900 text-[9px] font-bold tracking-wider uppercase rounded">
                  {t('product.lastPiece', 'Last Piece')}
                </span>
              )}
              {soldOut && (
                <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                  <span className="px-3 py-1 bg-white text-slate-900 text-xs font-bold tracking-wider uppercase">{t('product.outOfStock', 'Sold Out')}</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-1.5 max-w-[460px] mx-auto lg:mx-0">
                {images.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      activeImage === i ? 'border-slate-900' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <Image src={getProductImageUrl(img.url)} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="text-slate-900">
            {(product.brand || product.brandRef?.name) && (
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-1">
                {product.brand || product.brandRef?.name}
              </div>
            )}
            <h1 className="text-xl md:text-2xl font-bold leading-snug">{product.name}</h1>
            {product.shortDescription && (
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{product.shortDescription}</p>
            )}

            {product.rating?.count > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar
                      key={i}
                      size={11}
                      className={i < Math.round(product.rating.average) ? 'text-amber-500 fill-current' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-500">
                  {product.rating.average?.toFixed(1)} · {product.rating.count} reviews
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{fmtMoney(product.price, currency)}</span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {fmtMoney(product.originalPrice, currency)}
                </span>
              )}
            </div>

            {/* Uniqueness banner — emphasizing one-of-one */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-semibold text-amber-700">
              <FiAward size={10} />
              {t('product.oneOfOneBanner', "One of one in our boutique — when it’s gone, it’s gone.")}
            </div>

            {/* Attributes — dark chips on white */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {product.size && <Attribute label={t('product.size', 'Size')} value={product.size} />}
              {product.color && <Attribute label={t('product.color', 'Color')} value={product.color} />}
              {product.gender && (
                <Attribute label={t('product.for', 'For')} value={t(`nav.${product.gender}`, product.gender.charAt(0).toUpperCase() + product.gender.slice(1))} />
              )}
              {product.condition && (
                <Attribute label={t('product.condition', 'Condition')} value={product.condition === 'new' ? t('product.brandNew', 'Brand new') : product.condition === 'like-new' ? t('product.likeNew', 'Like new') : t('product.used', 'Used')} />
              )}
            </div>

            {/* Quantity + CTAs */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center border border-slate-300 rounded-full overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2.5 h-9 text-slate-600 hover:bg-slate-100" aria-label="Decrease">
                  <FiMinus size={11} />
                </button>
                <span className="px-2.5 text-xs font-semibold tabular-nums">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 10, q + 1))} className="px-2.5 h-9 text-slate-600 hover:bg-slate-100" aria-label="Increase">
                  <FiPlus size={11} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={soldOut}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiShoppingCart size={12} />
                {soldOut ? t('product.outOfStock', 'Sold Out') : t('product.addToCart', 'Add to Cart')}
              </button>
              <button
                onClick={toggleWishlist}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                  isWishlisted ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                aria-label="Wishlist"
              >
                <FiHeart size={12} className={isWishlisted ? 'fill-current' : ''} />
              </button>
              <button
                onClick={share}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-300 text-slate-700 hover:bg-slate-100"
                aria-label="Share"
              >
                <FiShare2 size={12} />
              </button>
            </div>

            {/* Trust row */}
            <div className="mt-6 grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-[10px]">
              <div className="flex items-center gap-1.5">
                <FiShield size={11} className="text-emerald-600" />
                <span>{t('product.trust.authentic', '100% Authentic')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiTruck size={11} className="text-blue-600" />
                <span>{t('product.trust.egyptWide', 'Cairo · Egypt-wide')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheckCircle size={11} className="text-amber-600" />
                <span>{t('product.trust.uniquePair', 'Unique pair')}</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{t('product.description', 'Description')}</h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* WHY THIS PAIR (DARK band — visual break) */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { Icon: FiAward, title: t('product.whyThisPair.oneOfOne.title', 'One of one'), body: t('product.whyThisPair.oneOfOne.body', 'This exact pair exists once in our inventory. No restocks.') },
            { Icon: FiShield, title: t('product.whyThisPair.authenticated.title', 'Authenticated by hand'), body: t('product.whyThisPair.authenticated.body', 'Verified by our team in Riyadh and Cairo before listing.') },
            { Icon: FiTruck, title: t('product.whyThisPair.delivered.title', 'Delivered to your door'), body: t('product.whyThisPair.delivered.body', 'Anywhere in Cairo within 1-2 days. All of Egypt within 4.') },
          ].map(({ Icon, title, body }, i) => (
            <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <Icon size={13} />
              </div>
              <h3 className="text-xs font-bold mb-1">{title}</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT FAQs (white) */}
      {productFaqs.length > 0 && (
        <section className="bg-white border-y border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-1 text-center">
              {t('product.aboutThisPair', 'ABOUT THIS PAIR')}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 text-center mb-6">{t('product.commonQuestions', 'Common questions')}</h2>
            <div className="space-y-2">
              {productFaqs.map((f, i) => (
                <FaqRow
                  key={i}
                  q={f.question}
                  a={f.answer}
                  open={openFaqIdx === i}
                  onToggle={() => setOpenFaqIdx(openFaqIdx === i ? -1 : i)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS (soft gray) */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-lg font-bold mb-4 text-slate-900">{t('product.reviews', 'Customer Reviews')}</h2>

          {isAuthenticated && hasPurchased && (
            <form onSubmit={submitReview} className="mb-5 p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}>
                    <FiStar size={16} className={i < reviewForm.rating ? 'text-amber-500 fill-current' : 'text-slate-300'} />
                  </button>
                ))}
              </div>
              <input
                placeholder={t('product.titleOptional', 'Title (optional)')}
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-md bg-slate-50 border border-slate-200 mb-2"
              />
              <textarea
                required
                placeholder={t('product.reviewPlaceholder', 'Share your thoughts about this pair...')}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={3}
                className="w-full px-3 py-1.5 text-xs rounded-md bg-slate-50 border border-slate-200 mb-2"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[11px] font-semibold hover:bg-slate-800 disabled:opacity-60"
              >
                {submittingReview ? t('product.posting', 'Posting...') : t('product.postReview', 'Post Review')}
              </button>
            </form>
          )}
          {isAuthenticated && !hasPurchased && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              {t('product.onlyVerifiedCanReview', 'Only customers who purchased and received this pair can review it.')}
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500">{t('product.beFirstToReview', 'Be the first to review this pair.')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((r) => (
                <div key={r._id} className="p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiStar key={i} size={11} className={i < r.rating ? 'text-amber-500 fill-current' : 'text-slate-300'} />
                        ))}
                      </div>
                      {r.title && <div className="font-bold text-xs mt-0.5 text-slate-900">{r.title}</div>}
                    </div>
                    <span className="text-[9px] text-slate-400">{fmtDate(r.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>
                  <div className="mt-1.5 text-[10px] text-slate-500">
                    {r.userId ? `${r.userId.firstName} ${r.userId.lastName || ''}`.trim() : 'Customer'}
                    {r.verified && <span className="ml-1.5 text-emerald-600 font-semibold">✓ {t('product.verifiedBuyer', 'Verified Buyer')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RELATED (white) */}
      {related.length > 0 && (
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">{t('product.moreLikeThis', 'MORE LIKE THIS')}</div>
                <h2 className="text-lg font-bold text-slate-900">{t('product.relatedProducts', 'You May Also Like')}</h2>
              </div>
              <Link href="/products" className="text-[11px] text-slate-500 hover:text-slate-900 font-semibold">View all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* RECENTLY VIEWED (DARK) */}
      {recentlyViewed.length > 0 && (
        <section className="bg-slate-950 text-white">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">{t('product.customersAlsoViewed', 'CUSTOMERS ALSO VIEWED')}</div>
                <h2 className="text-lg font-bold">{t('product.recentlyViewed', 'Recently Viewed')}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentlyViewed.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} variant="dark" />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Attribute({ label, value }) {
  return (
    <div className="px-2.5 py-1.5 rounded-md bg-slate-900 text-white">
      <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-[11px] font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}

function FaqRow({ q, a, open, onToggle }) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-slate-900' : 'border-slate-200'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-white hover:bg-slate-50"
      >
        <span className="text-xs font-semibold text-slate-900">{q}</span>
        <FiChevronDown size={12} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
          {a}
        </div>
      )}
    </div>
  );
}
