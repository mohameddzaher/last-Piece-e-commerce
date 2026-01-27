
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useWishlistStore, useCartStore, useAuthStore } from '@/store';
import { wishlistAPI, cartAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

export default function Wishlist() {
  const { items, removeItem, itemCount } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleRemoveItem = async (productId) => {
    try {
      if (isAuthenticated) {
        await wishlistAPI.remove({ productId });
      }
      removeItem(productId);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = async (item) => {
    try {
      if (isAuthenticated) {
        await cartAPI.add({ productId: item.productId, quantity: 1 });
      }
      addToCart({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });

      // Save to localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0}');
      const existingItem = cart.items.find((i) => i.productId === item.productId);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
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

  const handleMoveAllToCart = async () => {
    setLoading(true);
    try {
      for (const item of items) {
        await handleAddToCart(item);
      }
      toast.success('All items added to cart!');
    } catch (error) {
      toast.error('Failed to add items to cart');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6'
          >
            <FiHeart className='text-gray-600' size={40} />
          </motion.div>
          <h1 className='text-2xl font-bold text-white mb-2'>Your wishlist is empty</h1>
          <p className='text-gray-400 mb-8'>Save items you love to your wishlist</p>
          <Link
            href='/products'
            className='inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors'
          >
            Discover Products
            <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-950'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-white'>My Wishlist</h1>
            <p className='text-gray-400 mt-1'>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleMoveAllToCart}
              disabled={loading}
              className='flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50'
            >
              <FiShoppingCart size={18} />
              Add All to Cart
            </button>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-slate-900 rounded-xl border border-slate-800 overflow-hidden group'
              >
                <Link href={`/products/${item.productId}`}>
                  <div className='relative aspect-square bg-slate-800 overflow-hidden'>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-gray-600'>
                        <FiHeart size={40} />
                      </div>
                    )}
                  </div>
                </Link>

                <div className='p-4'>
                  <Link href={`/products/${item.productId}`}>
                    <h3 className='font-semibold text-white hover:text-blue-400 transition-colors truncate'>
                      {item.name}
                    </h3>
                  </Link>
                  <p className='text-blue-400 font-bold mt-2'>${item.price?.toFixed(2)}</p>

                  <div className='flex gap-2 mt-4'>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
                    >
                      <FiShoppingCart size={16} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className='p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
