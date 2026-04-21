'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useCartStore, useWishlistStore, useAuthStore } from '@/store';
import { cartAPI, wishlistAPI } from '@/utils/endpoints';
import { getProductImageUrl } from '@/utils/formatters';
import { fmtMoney } from '@/utils/format';
import { useI18n } from '@/utils/i18n';

function ProductCard({ product, variant = 'light' }) {
  const t = useI18n((s) => s.t);
  const { addItem } = useCartStore();
  const {
    items: wishlistItems,
    addItem: addToWishlistStore,
    removeItem: removeFromWishlistStore,
  } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const isWishlisted = wishlistItems?.some((i) => i.productId === product._id);
  const image = getProductImageUrl(product.thumbnail || product.images?.[0]?.url);
  const currency = product.sellingCurrency || 'EGP';
  const isDark = variant === 'dark';
  const soldOut = product.location === 'sold' || product.stock === 0 || !product.isAvailable;

  const onAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isAuthenticated) await cartAPI.add({ productId: product._id, quantity: 1 });
      addItem({ productId: product._id, name: product.name, price: product.price, image, quantity: 1 });
      toast.success(t('product.addToCart', 'Added to cart'));
    } catch { toast.error('Failed'); }
  };

  const onToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isWishlisted) {
        if (isAuthenticated) await wishlistAPI.remove({ productId: product._id });
        removeFromWishlistStore(product._id);
      } else {
        if (isAuthenticated) await wishlistAPI.add({ productId: product._id });
        addToWishlistStore({ productId: product._id, name: product.name, price: product.price, image });
      }
    } catch { toast.error('Failed'); }
  };

  return (
    <Link href={`/products/${product.slug || product._id}`} className="group block">
      <div
        className={`relative rounded-lg overflow-hidden border transition-all duration-300 ${
          isDark
            ? 'bg-slate-900 border-slate-800 hover:border-slate-600'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
        }`}
      >
        {/* Image — squarer, smaller overall */}
        <div className={`relative aspect-square overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full" />
          )}

          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {product.badges?.[0] && (
              <span className="px-1.5 py-0.5 bg-slate-900/90 backdrop-blur text-white rounded text-[9px] font-bold uppercase tracking-wider">
                {product.badges[0].label}
              </span>
            )}
            {product.stock === 1 && !soldOut && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-slate-900 rounded text-[9px] font-bold uppercase tracking-wider">
                {t('product.lastPiece', 'Last Piece')}
              </span>
            )}
          </div>

          {soldOut && (
            <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
              <span className="px-2 py-0.5 bg-white text-slate-900 text-[10px] font-bold tracking-wider uppercase">
                {t('product.outOfStock', 'Sold Out')}
              </span>
            </div>
          )}

          <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggleWishlist}
              aria-label="Wishlist"
              className={`w-7 h-7 rounded-full backdrop-blur flex items-center justify-center ${
                isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-900 hover:bg-white'
              }`}
            >
              <FiHeart size={11} className={isWishlisted ? 'fill-current' : ''} />
            </button>
            {!soldOut && (
              <button
                onClick={onAddToCart}
                aria-label="Add to cart"
                className="w-7 h-7 rounded-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center"
              >
                <FiShoppingCart size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Content — tighter padding, smaller text */}
        <div className="p-2.5">
          {(product.brand || product.brandRef?.name) && (
            <div className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {product.brand || product.brandRef?.name}
            </div>
          )}
          <h3 className={`text-xs font-semibold line-clamp-2 leading-tight min-h-[2rem] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {fmtMoney(product.price, currency)}
            </span>
            {product.size && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                {product.size}
              </span>
            )}
          </div>

          {product.rating?.count > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-2.5 h-2.5 ${
                      i < Math.round(product.rating.average || 0)
                        ? 'text-amber-500'
                        : isDark
                          ? 'text-slate-700'
                          : 'text-slate-200'
                    } fill-current`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({product.rating.count})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Memoized so the 20+ cards on the products listing don't re-render every time
// an unrelated store slice changes (cart itemCount, auth state, etc.). The
// Zustand selectors inside the component are already fine-grained, but React
// still runs the render function on parent updates — memo skips that.
export default memo(ProductCard, (prev, next) =>
  prev.variant === next.variant &&
  prev.product?._id === next.product?._id &&
  prev.product?.price === next.product?.price &&
  prev.product?.location === next.product?.location &&
  prev.product?.stock === next.product?.stock &&
  prev.product?.thumbnail === next.product?.thumbnail,
);
