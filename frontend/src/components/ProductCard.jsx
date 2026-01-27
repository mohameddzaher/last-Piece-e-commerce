'use client';

import Link from 'next/link';
import { FiHeart, FiShoppingCart, FiEye } from 'react-icons/fi';
import { useCartStore, useWishlistStore, useAuthStore } from '@/store';
import { cartAPI, wishlistAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

export default function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlistStore, removeItem: removeFromWishlistStore } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const isWishlisted = wishlistItems?.some((item) => item.productId === product._id);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isAuthenticated) {
        await cartAPI.add({ productId: product._id, quantity: 1 });
      }

      addItem({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || product.thumbnail,
        quantity: 1,
      });

      // Save to localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0}');
      const existingItem = cart.items.find((i) => i.productId === product._id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || product.thumbnail,
          quantity: 1,
        });
      }
      cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      localStorage.setItem('cart', JSON.stringify(cart));

      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isWishlisted) {
        if (isAuthenticated) {
          await wishlistAPI.remove({ productId: product._id });
        }
        removeFromWishlistStore(product._id);
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
        toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <Link href={`/products/${product.slug || product._id}`}>
      <div className='bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-all duration-300 group cursor-pointer'>
        {/* Image Container */}
        <div className='relative overflow-hidden bg-slate-800 aspect-square'>
          <img
            src={product.thumbnail || product.images?.[0]?.url || '/placeholder.jpg'}
            alt={product.name}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
          />

          {/* Badges */}
          <div className='absolute top-2 left-2 flex flex-col gap-1'>
            {discountPercent > 0 && (
              <div className='bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold'>
                -{discountPercent}%
              </div>
            )}
            {product.stock === 1 && (
              <div className='bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold'>
                Last Piece!
              </div>
            )}
            {product.badges?.[0] && (
              <div className='bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold capitalize'>
                {product.badges[0].label}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className='absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0'>
            <button
              onClick={handleToggleWishlist}
              className={`p-1.5 rounded backdrop-blur-md transition-colors ${
                isWishlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-slate-900 hover:bg-red-500 hover:text-white'
              }`}
              aria-label='Add to wishlist'
            >
              <FiHeart size={12} className={isWishlisted ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleAddToCart}
              className='p-1.5 bg-white/90 text-slate-900 rounded hover:bg-blue-500 hover:text-white backdrop-blur-md transition-colors'
              aria-label='Add to cart'
            >
              <FiShoppingCart size={12} />
            </button>
          </div>

          {/* View Button */}
          <div className='absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0'>
            <div className='flex items-center justify-center gap-1 text-white text-[10px] font-medium'>
              <FiEye size={12} />
              Quick View
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-3'>
          {/* Category */}
          {product.category && (
            <p className='text-[10px] text-blue-400 mb-0.5'>
              {product.category.name || product.category}
            </p>
          )}

          {/* Name */}
          <h3 className='text-xs text-white font-semibold mb-1.5 truncate group-hover:text-blue-400 transition-colors'>
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className='flex items-center gap-1 mb-2'>
              <div className='flex'>
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-2.5 h-2.5 ${
                      i < Math.round(product.rating.average || 0)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-600 fill-slate-600'
                    }`}
                    viewBox='0 0 20 20'
                  >
                    <path d='M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z' />
                  </svg>
                ))}
              </div>
              <span className='text-[10px] text-gray-500'>({product.rating.count || 0})</span>
            </div>
          )}

          {/* Price */}
          <div className='flex items-baseline gap-1.5'>
            <span className='text-sm font-bold text-white'>${product.price?.toFixed(2)}</span>
            {product.originalPrice && (
              <span className='text-[10px] text-gray-500 line-through'>${product.originalPrice?.toFixed(2)}</span>
            )}
          </div>

          {/* Stock Status */}
          <div className='mt-2 flex items-center gap-1'>
            <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-[10px] font-medium ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
