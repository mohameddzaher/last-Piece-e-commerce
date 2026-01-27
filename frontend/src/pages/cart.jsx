
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiTag, FiX } from 'react-icons/fi';
import { useCartStore, useAuthStore } from '@/store';
import { cartAPI } from '@/utils/endpoints';
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
    setLoading(true);
    try {
      // Simulate coupon validation
      if (couponCode.toUpperCase() === 'SAVE10') {
        setDiscount(total * 0.1);
        setCouponApplied(true);
        toast.success('Coupon applied! 10% discount');
      } else if (couponCode.toUpperCase() === 'SAVE20') {
        setDiscount(total * 0.2);
        setCouponApplied(true);
        toast.success('Coupon applied! 20% discount');
      } else {
        toast.error('Invalid coupon code');
      }
    } catch (error) {
      toast.error('Failed to apply coupon');
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

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-slate-900 rounded-2xl border border-slate-800 p-6 sticky top-24'>
              <h2 className='text-xl font-bold text-white mb-6'>Order Summary</h2>

              {/* Coupon */}
              <div className='mb-6'>
                {couponApplied ? (
                  <div className='flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <FiTag className='text-green-400' />
                      <span className='text-green-400 font-medium'>{couponCode.toUpperCase()}</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className='text-green-400 hover:text-green-300'>
                      <FiX size={18} />
                    </button>
                  </div>
                ) : (
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder='Coupon code'
                      className='flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={loading || !couponCode.trim()}
                      className='px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50'
                    >
                      Apply
                    </button>
                  </div>
                )}
                <p className='text-xs text-gray-500 mt-2'>Try: SAVE10 or SAVE20</p>
              </div>

              {/* Summary Details */}
              <div className='space-y-3 mb-6'>
                <div className='flex justify-between text-gray-400'>
                  <span>Subtotal</span>
                  <span className='text-white'>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className='flex justify-between text-green-400'>
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className='flex justify-between text-gray-400'>
                  <span>Shipping</span>
                  <span className='text-white'>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                {subtotal < 50 && (
                  <p className='text-xs text-gray-500'>
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <hr className='border-slate-800' />
                <div className='flex justify-between text-lg font-bold'>
                  <span className='text-white'>Total</span>
                  <span className='text-white'>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className='w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-colors'
              >
                Proceed to Checkout
                <FiArrowRight />
              </button>

              {/* Continue Shopping */}
              <Link
                href='/products'
                className='block text-center text-gray-400 hover:text-white mt-4 transition-colors'
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
