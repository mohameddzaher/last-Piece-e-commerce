
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiShare2, FiChevronRight, FiMinus, FiPlus, FiStar, FiTruck, FiShield, FiRefreshCw, FiEdit3, FiSend } from 'react-icons/fi';
import { productAPI, cartAPI, wishlistAPI, reviewAPI } from '@/utils/endpoints';
import { useCartStore, useWishlistStore, useAuthStore } from '@/store';
import { toast } from 'react-toastify';
import ProductCard from '@/components/ProductCard';

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlistStore, removeItem: removeFromWishlistStore } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product && wishlistItems) {
      setIsWishlisted(wishlistItems.some((item) => item.productId === product._id));
    }
  }, [product, wishlistItems]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getBySlug(slug);
      if (res.data.success) {
        setProduct(res.data.data);
        // Fetch related products and reviews
        fetchRelatedProducts(res.data.data._id);
        fetchReviews(res.data.data._id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      const res = await reviewAPI.getProductReviews(productId);
      if (res.data.success) {
        setReviews(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
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
    if (!product) return;

    try {
      setSubmittingReview(true);
      const res = await reviewAPI.create({
        productId: product._id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        isStoreReview: false,
      });
      if (res.data.success) {
        toast.success('Review submitted! It will appear after approval.');
        setReviewForm({ rating: 5, title: '', comment: '' });
        setShowReviewForm(false);
        fetchReviews(product._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating, interactive = false, onSelect = null) => {
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
              size={interactive ? 24 : 16}
            />
          </button>
        ))}
      </div>
    );
  };

  const fetchRelatedProducts = async (productId) => {
    try {
      const res = await productAPI.getRelated(productId, 4);
      if (res.data.success) {
        setRelatedProducts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      if (isAuthenticated) {
        await cartAPI.add({ productId: product._id, quantity });
      }

      addItem({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || product.thumbnail,
        quantity,
      });

      // Save to localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0}');
      const existingItem = cart.items.find((i) => i.productId === product._id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || product.thumbnail,
          quantity,
        });
      }
      cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      localStorage.setItem('cart', JSON.stringify(cart));

      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    try {
      if (isWishlisted) {
        if (isAuthenticated) {
          await wishlistAPI.remove({ productId: product._id });
        }
        removeFromWishlistStore(product._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        if (isAuthenticated) {
          await wishlistAPI.add({ productId: product._id });
        }
        addToWishlistStore({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || product.thumbnail,
        });
        setIsWishlisted(true);
        toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center'>
        <h1 className='text-2xl font-bold mb-4'>Product not found</h1>
        <Link href='/products' className='text-blue-500 hover:underline'>
          Back to Products
        </Link>
      </div>
    );
  }

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Breadcrumb */}
      <div className='bg-slate-900 border-b border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <nav className='flex items-center gap-2 text-sm text-gray-400'>
            <Link href='/' className='hover:text-white transition-colors'>
              Home
            </Link>
            <FiChevronRight size={14} />
            <Link href='/products' className='hover:text-white transition-colors'>
              Products
            </Link>
            <FiChevronRight size={14} />
            <span className='text-white truncate'>{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <div className='max-w-6xl mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Image Gallery */}
          <div className='space-y-3'>
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='relative aspect-square bg-slate-900 rounded-xl overflow-hidden'
            >
              <img
                src={product.images?.[selectedImage]?.url || product.thumbnail || '/placeholder.jpg'}
                alt={product.name}
                className='w-full h-full object-cover'
              />
              {discountPercent > 0 && (
                <div className='absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold'>
                  -{discountPercent}%
                </div>
              )}
              {product.stock === 1 && (
                <div className='absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold'>
                  Last Piece!
                </div>
              )}
            </motion.div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className='flex gap-2 overflow-x-auto pb-2'>
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-blue-500' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <img src={image.url} alt={`${product.name} ${idx + 1}`} className='w-full h-full object-cover' />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className='space-y-4'>
            {/* Category */}
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug || product.category}`}
                className='inline-block text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium'
              >
                {product.category.name || product.category}
              </Link>
            )}

            {/* Title */}
            <h1 className='text-2xl md:text-3xl font-bold text-white leading-tight'>{product.name}</h1>

            {/* Rating */}
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-0.5'>
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={14}
                    className={i < Math.round(product.rating?.average || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                  />
                ))}
              </div>
              <span className='text-sm text-gray-400'>({product.rating?.count || 0})</span>
            </div>

            {/* Price */}
            <div className='flex items-baseline gap-3'>
              <span className='text-3xl font-bold text-white'>${product.price?.toFixed(2)}</span>
              {product.originalPrice && (
                <span className='text-lg text-gray-500 line-through'>${product.originalPrice?.toFixed(2)}</span>
              )}
            </div>

            {/* Description */}
            <p className='text-sm text-gray-400 leading-relaxed'>{product.description}</p>

            {/* Stock Status */}
            <div className='flex items-center gap-2'>
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity & Actions */}
            {product.stock > 0 && (
              <div className='space-y-3 pt-2'>
                {/* Quantity Selector */}
                <div className='flex items-center gap-3'>
                  <span className='text-sm text-gray-400'>Qty:</span>
                  <div className='flex items-center gap-1 bg-slate-800 rounded-lg p-0.5'>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className='p-2 hover:bg-slate-700 rounded-md transition-colors text-white'
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className='w-10 text-center text-sm font-bold text-white'>{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className='p-2 hover:bg-slate-700 rounded-md transition-colors text-white'
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3'>
                  <button
                    onClick={handleAddToCart}
                    className='flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors'
                  >
                    <FiShoppingCart size={16} />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      isWishlisted
                        ? 'bg-red-500/20 border-red-500 text-red-500'
                        : 'border-slate-700 text-gray-400 hover:border-red-500 hover:text-red-500'
                    }`}
                  >
                    <FiHeart size={16} className={isWishlisted ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={handleShare}
                    className='p-3 rounded-lg border-2 border-slate-700 text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors'
                  >
                    <FiShare2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Features */}
            <div className='grid grid-cols-3 gap-3 pt-4 border-t border-slate-800'>
              <div className='text-center'>
                <FiTruck className='mx-auto mb-1.5 text-blue-400' size={18} />
                <p className='text-xs text-gray-400'>Free Shipping</p>
              </div>
              <div className='text-center'>
                <FiShield className='mx-auto mb-1.5 text-blue-400' size={18} />
                <p className='text-xs text-gray-400'>Secure Payment</p>
              </div>
              <div className='text-center'>
                <FiRefreshCw className='mx-auto mb-1.5 text-blue-400' size={18} />
                <p className='text-xs text-gray-400'>Easy Returns</p>
              </div>
            </div>

            {/* SKU */}
            {product.sku && (
              <p className='text-xs text-gray-500'>
                SKU: <span className='text-gray-400'>{product.sku}</span>
              </p>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className='mt-10'>
          <div className='bg-slate-900 rounded-xl p-6'>
            <h2 className='text-xl font-bold text-white mb-4'>Product Details</h2>
            <div className='prose prose-invert max-w-none'>
              <p className='text-sm text-gray-400 leading-relaxed'>{product.description}</p>
              {product.specifications && (
                <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className='flex justify-between py-1.5 border-b border-slate-800 text-sm'>
                      <span className='text-gray-500 capitalize'>{key.replace(/_/g, ' ')}</span>
                      <span className='text-white'>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className='mt-10'>
          <div className='bg-slate-900 rounded-xl p-6'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='text-xl font-bold text-white'>Customer Reviews</h2>
              {isAuthenticated && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors'
                >
                  <FiEdit3 size={14} />
                  Write Review
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className='mb-6 overflow-hidden'
              >
                <form onSubmit={handleSubmitReview} className='p-5 bg-slate-800 rounded-lg'>
                  <h3 className='text-base font-semibold text-white mb-3'>Share Your Experience</h3>

                  <div className='mb-3'>
                    <label className='block text-xs text-gray-400 mb-1.5'>Your Rating</label>
                    {renderStars(reviewForm.rating, true, (star) => setReviewForm({ ...reviewForm, rating: star }))}
                  </div>

                  <div className='mb-3'>
                    <label className='block text-xs text-gray-400 mb-1.5'>Review Title (Optional)</label>
                    <input
                      type='text'
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      placeholder='Summarize your experience'
                      className='w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div className='mb-3'>
                    <label className='block text-xs text-gray-400 mb-1.5'>Your Review</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder='Tell us about your experience...'
                      className='w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                      rows={3}
                    />
                  </div>

                  <div className='flex gap-3'>
                    <button
                      type='button'
                      onClick={() => setShowReviewForm(false)}
                      className='px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={submittingReview}
                      className='flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors'
                    >
                      {submittingReview ? (
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <>
                          <FiSend size={14} />
                          Submit
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className='space-y-4'>
                {reviews.map((review) => (
                  <div key={review._id} className='p-4 bg-slate-800 rounded-lg'>
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center gap-2.5'>
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                          <span className='text-white font-bold text-xs'>
                            {review.userId?.firstName?.[0]}{review.userId?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className='text-white font-medium text-sm'>
                            {review.userId?.firstName} {review.userId?.lastName?.[0]}.
                          </p>
                          <div className='flex items-center gap-1.5'>
                            {renderStars(review.rating)}
                            <span className='text-gray-500 text-xs'>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {review.title && (
                      <h4 className='text-white font-medium text-sm mb-1.5'>{review.title}</h4>
                    )}
                    <p className='text-gray-400 text-sm'>{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <FiStar className='mx-auto text-gray-600 mb-2' size={24} />
                <h3 className='text-sm font-bold text-white mb-0.5'>No reviews yet</h3>
                <p className='text-gray-400 text-xs'>Be the first to review this product!</p>
                {!isAuthenticated && (
                  <Link
                    href='/login'
                    className='inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors'
                  >
                    Login to Write Review
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className='mt-10'>
            <h2 className='text-xl font-bold text-white mb-5'>You May Also Like</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct._id}
                  product={relatedProduct}
                  onAddToCart={() => {}}
                  onAddToWishlist={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
