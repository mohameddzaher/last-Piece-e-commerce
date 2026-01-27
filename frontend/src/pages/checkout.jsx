
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiLock,
  FiCreditCard,
  FiTruck,
  FiCheck,
  FiShield,
  FiPackage,
} from 'react-icons/fi';
import { orderAPI } from '@/utils/endpoints';
import { useCartStore, useAuthStore } from '@/store';
import { toast } from 'react-toastify';

export default function Checkout() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [formData, setFormData] = useState({
    shippingAddress: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    billingAddress: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    paymentMethod: 'cod',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      router.push('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
        },
      }));
    }
  }, [isAuthenticated, items, router, user]);

  const handleAddressChange = (addressType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const orderData = {
      ...formData,
      billingAddress: sameAsShipping ? formData.shippingAddress : formData.billingAddress,
    };

    try {
      const res = await orderAPI.create(orderData);
      if (res.data.success) {
        toast.success('Order placed successfully!');
        clearCart();
        router.push(`/orders/${res.data.data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const orderTotal = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <FiPackage className='mx-auto text-gray-600 mb-3' size={40} />
          <p className='text-gray-400'>Your cart is empty</p>
          <Link href='/products' className='text-blue-400 hover:underline mt-2 inline-block text-sm'>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-950 py-6'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* Header */}
        <div className='mb-6'>
          <Link
            href='/cart'
            className='inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors mb-4'
          >
            <FiArrowLeft size={16} />
            Back to Cart
          </Link>
          <h1 className='text-2xl font-bold text-white'>Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className='flex items-center justify-center mb-8'>
          {[
            { num: 1, label: 'Shipping' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Review' },
          ].map((s, idx) => (
            <div key={s.num} className='flex items-center'>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  step >= s.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-gray-500'
                }`}
              >
                {step > s.num ? <FiCheck size={14} /> : s.num}
              </div>
              <span className={`ml-2 text-xs ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>
                {s.label}
              </span>
              {idx < 2 && <div className='w-12 h-px bg-slate-700 mx-3' />}
            </div>
          ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Form */}
          <div className='lg:col-span-2'>
            <form onSubmit={handleSubmit}>
              {/* Step 1: Shipping */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className='bg-slate-900 border border-slate-800 rounded-xl p-5'
                >
                  <h2 className='text-base font-semibold text-white mb-4 flex items-center gap-2'>
                    <FiTruck className='text-blue-400' size={18} />
                    Shipping Address
                  </h2>

                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>First Name</label>
                      <input
                        type='text'
                        value={formData.shippingAddress.firstName}
                        onChange={(e) => handleAddressChange('shippingAddress', 'firstName', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>Last Name</label>
                      <input
                        type='text'
                        value={formData.shippingAddress.lastName}
                        onChange={(e) => handleAddressChange('shippingAddress', 'lastName', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>Email</label>
                      <input
                        type='email'
                        value={formData.shippingAddress.email}
                        onChange={(e) => handleAddressChange('shippingAddress', 'email', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>Phone</label>
                      <input
                        type='tel'
                        value={formData.shippingAddress.phone}
                        onChange={(e) => handleAddressChange('shippingAddress', 'phone', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div className='col-span-2'>
                      <label className='block text-xs text-gray-400 mb-1'>Street Address</label>
                      <input
                        type='text'
                        value={formData.shippingAddress.street}
                        onChange={(e) => handleAddressChange('shippingAddress', 'street', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>City</label>
                      <input
                        type='text'
                        value={formData.shippingAddress.city}
                        onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>State</label>
                      <input
                        type='text'
                        value={formData.shippingAddress.state}
                        onChange={(e) => handleAddressChange('shippingAddress', 'state', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>Postal Code</label>
                      <input
                        type='text'
                        value={formData.shippingAddress.postalCode}
                        onChange={(e) => handleAddressChange('shippingAddress', 'postalCode', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-400 mb-1'>Country</label>
                      <input
                        type='text'
                        value={formData.shippingAddress.country}
                        onChange={(e) => handleAddressChange('shippingAddress', 'country', e.target.value)}
                        required
                        className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                      />
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={() => setStep(2)}
                    className='w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors'
                  >
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className='space-y-4'
                >
                  {/* Billing Address */}
                  <div className='bg-slate-900 border border-slate-800 rounded-xl p-5'>
                    <h2 className='text-base font-semibold text-white mb-4'>Billing Address</h2>

                    <label className='flex items-center gap-2 mb-4 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className='w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500'
                      />
                      <span className='text-sm text-gray-300'>Same as shipping address</span>
                    </label>

                    {!sameAsShipping && (
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-xs text-gray-400 mb-1'>First Name</label>
                          <input
                            type='text'
                            value={formData.billingAddress.firstName}
                            onChange={(e) => handleAddressChange('billingAddress', 'firstName', e.target.value)}
                            required
                            className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-gray-400 mb-1'>Last Name</label>
                          <input
                            type='text'
                            value={formData.billingAddress.lastName}
                            onChange={(e) => handleAddressChange('billingAddress', 'lastName', e.target.value)}
                            required
                            className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                          />
                        </div>
                        <div className='col-span-2'>
                          <label className='block text-xs text-gray-400 mb-1'>Street Address</label>
                          <input
                            type='text'
                            value={formData.billingAddress.street}
                            onChange={(e) => handleAddressChange('billingAddress', 'street', e.target.value)}
                            required
                            className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-gray-400 mb-1'>City</label>
                          <input
                            type='text'
                            value={formData.billingAddress.city}
                            onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                            required
                            className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-gray-400 mb-1'>Postal Code</label>
                          <input
                            type='text'
                            value={formData.billingAddress.postalCode}
                            onChange={(e) => handleAddressChange('billingAddress', 'postalCode', e.target.value)}
                            required
                            className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className='bg-slate-900 border border-slate-800 rounded-xl p-5'>
                    <h2 className='text-base font-semibold text-white mb-4 flex items-center gap-2'>
                      <FiCreditCard className='text-blue-400' size={18} />
                      Payment Method
                    </h2>

                    <div className='space-y-2'>
                      {/* Cash on Delivery - Available */}
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.paymentMethod === 'cod'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type='radio'
                          name='paymentMethod'
                          value='cod'
                          checked={formData.paymentMethod === 'cod'}
                          onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                          className='w-4 h-4 text-blue-600 bg-slate-800 border-slate-700'
                        />
                        <span className='text-lg'>💵</span>
                        <div className='flex-1'>
                          <span className='text-sm text-white'>Cash on Delivery</span>
                          <span className='ml-2 text-xs text-green-400'>(Available)</span>
                        </div>
                      </label>

                      {/* Credit Card - Unavailable */}
                      <div
                        onClick={() => toast.info('Credit/Debit Card payment is currently unavailable. Please use Cash on Delivery.')}
                        className='flex items-center gap-3 p-3 rounded-lg border border-slate-700 opacity-50 cursor-not-allowed'
                      >
                        <div className='w-4 h-4 rounded-full border-2 border-slate-600'></div>
                        <span className='text-lg'>💳</span>
                        <div className='flex-1'>
                          <span className='text-sm text-gray-400'>Credit / Debit Card</span>
                          <span className='ml-2 text-xs text-yellow-500'>(Coming Soon)</span>
                        </div>
                      </div>

                      {/* PayPal - Unavailable */}
                      <div
                        onClick={() => toast.info('PayPal payment is currently unavailable. Please use Cash on Delivery.')}
                        className='flex items-center gap-3 p-3 rounded-lg border border-slate-700 opacity-50 cursor-not-allowed'
                      >
                        <div className='w-4 h-4 rounded-full border-2 border-slate-600'></div>
                        <span className='text-lg'>🅿️</span>
                        <div className='flex-1'>
                          <span className='text-sm text-gray-400'>PayPal</span>
                          <span className='ml-2 text-xs text-yellow-500'>(Coming Soon)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-3'>
                    <button
                      type='button'
                      onClick={() => setStep(1)}
                      className='flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors'
                    >
                      Back
                    </button>
                    <button
                      type='button'
                      onClick={() => setStep(3)}
                      className='flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors'
                    >
                      Review Order
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className='space-y-4'
                >
                  {/* Order Items */}
                  <div className='bg-slate-900 border border-slate-800 rounded-xl p-5'>
                    <h2 className='text-base font-semibold text-white mb-4'>Order Items</h2>
                    <div className='space-y-3'>
                      {items.map((item) => (
                        <div key={item.productId} className='flex items-center gap-3'>
                          <div className='w-14 h-14 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0'>
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={56}
                                height={56}
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <div className='w-full h-full flex items-center justify-center'>
                                <FiPackage className='text-gray-600' size={20} />
                              </div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-white truncate'>{item.name}</p>
                            <p className='text-xs text-gray-500'>Qty: {item.quantity}</p>
                          </div>
                          <p className='text-sm font-medium text-white'>
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className='bg-slate-900 border border-slate-800 rounded-xl p-5'>
                    <h2 className='text-base font-semibold text-white mb-3'>Shipping To</h2>
                    <div className='text-sm text-gray-400'>
                      <p className='text-white'>
                        {formData.shippingAddress.firstName} {formData.shippingAddress.lastName}
                      </p>
                      <p>{formData.shippingAddress.street}</p>
                      <p>
                        {formData.shippingAddress.city}, {formData.shippingAddress.state}{' '}
                        {formData.shippingAddress.postalCode}
                      </p>
                      <p>{formData.shippingAddress.country}</p>
                    </div>
                  </div>

                  <div className='flex gap-3'>
                    <button
                      type='button'
                      onClick={() => setStep(2)}
                      className='flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors'
                    >
                      Back
                    </button>
                    <button
                      type='submit'
                      disabled={loading}
                      className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50'
                    >
                      {loading ? (
                        <>
                          <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiLock size={14} />
                          Place Order
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-24'>
              <h2 className='text-base font-semibold text-white mb-4'>Order Summary</h2>

              <div className='space-y-3 mb-4'>
                {items.slice(0, 3).map((item) => (
                  <div key={item.productId} className='flex items-center gap-2'>
                    <div className='w-10 h-10 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0'>
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={40}
                          height={40}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <FiPackage className='text-gray-600' size={14} />
                        </div>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs text-white truncate'>{item.name}</p>
                      <p className='text-xs text-gray-500'>x{item.quantity}</p>
                    </div>
                    <p className='text-xs text-white'>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className='text-xs text-gray-500'>+{items.length - 3} more items</p>
                )}
              </div>

              <div className='border-t border-slate-800 pt-4 space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Subtotal</span>
                  <span className='text-white'>${subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Shipping</span>
                  <span className='text-white'>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Tax</span>
                  <span className='text-white'>${tax.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-base font-semibold pt-2 border-t border-slate-800'>
                  <span className='text-white'>Total</span>
                  <span className='text-white'>${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className='mt-4 pt-4 border-t border-slate-800'>
                <div className='flex items-center gap-2 text-xs text-gray-500'>
                  <FiShield className='text-green-500' size={14} />
                  <span>Secure checkout</span>
                </div>
                <div className='flex items-center gap-2 text-xs text-gray-500 mt-1'>
                  <FiLock className='text-green-500' size={14} />
                  <span>SSL encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
