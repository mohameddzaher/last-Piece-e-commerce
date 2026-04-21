
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiTag, FiX } from 'react-icons/fi';
import { useCartStore, useAuthStore } from '@/store';
import { cartAPI, promoCodeAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

export default function Cart() {
  const router = useRouter();
  const { items, total, itemCount, removeItem, updateQuantity, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sync cart with localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify({ items, total, itemCount }));
  }, [items, total, itemCount]);

  const handleRemoveItem = async (productId) => {
    try {
      if (isAuthenticated) {
        await cartAPI.remove({ productId });
      }
      removeItem(productId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      if (isAuthenticated) {
        await cartAPI.update({ productId, quantity: newQuantity });
      }
      updateQuantity(productId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!isAuthenticated) {
      toast.warn('Please sign in to use promo codes');
      return;
    }
    setLoading(true);
    try {
      const res = await promoCodeAPI.validate({
        code: couponCode.trim().toUpperCase(),
        subtotal: total,
      });
      const data = res.data.data;
      setDiscount(data.discount || 0);
      setCouponApplied(true);
      if (data.type === 'percent') {
        toast.success(`Promo applied! ${data.value}% off`);
      } else if (data.type === 'fixed') {
        toast.success(`Promo applied! ${data.discount} EGP off`);
      } else if (data.freeShipping) {
        toast.success('Promo applied! Free shipping');
      } else {
        toast.success('Promo applied');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid promo code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setDiscount(0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to continue to checkout');
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  const subtotal = total;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const finalTotal = subtotal - discount + shipping;

  if (items.length === 0) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6'
          >
            <FiShoppingBag className='text-gray-600' size={40} />
          </motion.div>
          <h1 className='text-2xl font-bold text-white mb-2'>Your cart is empty</h1>
          <p className='text-gray-400 mb-8'>Looks like you haven't added anything to your cart yet</p>
          <Link
            href='/products'
            className='inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors'
          >
            Start Shopping
            <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-950'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold text-white mb-8'>Shopping Cart</h1>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-4'>
            <div className='bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden'>
              <div className='p-4 border-b border-slate-800 flex items-center justify-between'>
                <p className='text-gray-400'>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
                </p>
                <button
                  onClick={() => {
                    clearCart();
                    toast.success('Cart cleared');
                  }}
                  className='text-sm text-red-400 hover:text-red-300 transition-colors'
                >
                  Clear Cart
                </button>
              </div>

              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className='p-4 border-b border-slate-800 last:border-b-0'
                  >
                    <div className='flex gap-4'>
                      {/* Image */}
                      <Link href={`/products/${item.productId}`} className='flex-shrink-0'>
                        <div className='w-24 h-24 bg-slate-800 rounded-lg overflow-hidden'>
                          {item.image ? (
                            <img src={item.image} alt={item.name} className='w-full h-full object-cover' />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center text-gray-600'>
                              <FiShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className='flex-1 min-w-0'>
                        <Link href={`/products/${item.productId}`}>
                          <h3 className='font-semibold text-white hover:text-blue-400 transition-colors truncate'>
                            {item.name}
                          </h3>
                        </Link>
                        <p className='text-blue-400 font-bold mt-1'>${item.price?.toFixed(2)}</p>

                        {/* Quantity Controls */}
                        <div className='flex items-center gap-4 mt-3'>
                          <div className='flex items-center gap-1 bg-slate-800 rounded-lg'>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className='p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50'
                            >
                              <FiMinus size={16} className='text-white' />
                            </button>
                            <span className='w-10 text-center font-medium text-white'>{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              className='p-2 hover:bg-slate-700 rounded-lg transition-colors'
                            >
                              <FiPlus size={16} className='text-white' />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className='p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className='text-right'>
                        <p className='font-bold text-white'>${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Order Summary — compact */}
          <div className='lg:col-span-1'>
            <div className='bg-slate-900 rounded-xl border border-slate-800 p-4 sticky top-20'>
              <h2 className='text-sm font-bold text-white mb-4'>Order Summary</h2>

              {/* Coupon */}
              <div className='mb-4'>
                {couponApplied ? (
                  <div className='flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg'>
                    <div className='flex items-center gap-1.5'>
                      <FiTag className='text-green-400' size={12} />
                      <span className='text-green-400 font-semibold text-xs'>{couponCode.toUpperCase()}</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className='text-green-400 hover:text-green-300' aria-label='Remove'>
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className='flex gap-1.5'>
                    <input
                      type='text'
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder='Promo code'
                      className='flex-1 h-9 px-3 bg-slate-800 border border-slate-700 rounded-md text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={loading || !couponCode.trim()}
                      className='h-9 px-3 bg-white hover:bg-gray-100 text-slate-900 rounded-md text-xs font-semibold disabled:opacity-50'
                    >
                      {loading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                <p className='text-[10px] text-gray-500 mt-1.5'>Try: WELCOME10 · FIRSTPAIR500</p>
              </div>

              {/* Summary Details */}
              <div className='space-y-2 mb-4 text-xs'>
                <div className='flex justify-between text-gray-400'>
                  <span>Subtotal</span>
                  <span className='text-white'>EGP {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className='flex justify-between text-green-400'>
                    <span>Discount</span>
                    <span>− EGP {Math.round(discount).toLocaleString()}</span>
                  </div>
                )}
                <div className='flex justify-between text-gray-400'>
                  <span>Shipping</span>
                  <span className='text-white'>{shipping === 0 ? 'Free' : `EGP ${shipping.toLocaleString()}`}</span>
                </div>
                {subtotal > 0 && subtotal < 5000 && (
                  <p className='text-[10px] text-gray-500'>
                    Add EGP {(5000 - subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
                <hr className='border-slate-800' />
                <div className='flex justify-between text-sm font-bold pt-1'>
                  <span className='text-white'>Total</span>
                  <span className='text-white'>EGP {Math.round(finalTotal).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className='w-full h-10 flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 text-slate-900 rounded-full text-xs font-semibold'
              >
                Proceed to Checkout
                <FiArrowRight size={12} />
              </button>

              <Link
                href='/products'
                className='block text-center text-[11px] text-gray-400 hover:text-white mt-3'
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
