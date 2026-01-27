'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuthStore, useCartStore } from '@/store';
import { cartAPI } from '@/utils/endpoints';
import { ToastContainer } from 'react-toastify';

export default function Layout({ children }) {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setCart = useCartStore((state) => state.setCart);

  useEffect(() => {
    setMounted(true);
    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }

    // If authenticated, fetch cart from server
    if (isAuthenticated) {
      cartAPI
        .get()
        .then((res) => {
          if (res.data.success) {
            setCart(res.data.data);
          }
        })
        .catch((err) => console.error('Error fetching cart:', err));
    }
  }, [isAuthenticated, setCart]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <div>
      <Header />
      <main className='min-h-screen pt-16'>{children}</main>
      <Footer />
      <ToastContainer
        position='bottom-right'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
