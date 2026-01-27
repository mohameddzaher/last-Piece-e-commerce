import '@/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ToastContainer } from 'react-toastify';
import { useAuthStore, useCartStore, useWishlistStore } from '@/store';
import { cartAPI, wishlistAPI, authAPI } from '@/utils/endpoints';

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, setUser, setTokens } = useAuthStore();
  const setCart = useCartStore((state) => state.setCart);
  const setWishlist = useWishlistStore((state) => state.setWishlist);

  useEffect(() => {
    setMounted(true);

    // Check for saved tokens and restore session
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
      // Fetch user profile
      authAPI
        .getProfile()
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Error fetching profile:', err);
          // Token might be expired, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        });
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        setCart(cart);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Fetch cart and wishlist when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      cartAPI
        .get()
        .then((res) => {
          if (res.data.success && res.data.data) {
            setCart(res.data.data);
          }
        })
        .catch((err) => console.error('Error fetching cart:', err));

      wishlistAPI
        .get()
        .then((res) => {
          if (res.data.success && res.data.data) {
            setWishlist(res.data.data);
          }
        })
        .catch((err) => console.error('Error fetching wishlist:', err));
    }
  }, [isAuthenticated]);

  // Pages that don't need the standard layout
  const noLayoutPages = ['/admin', '/admin/products', '/admin/orders', '/admin/users'];
  const isNoLayoutPage = noLayoutPages.some((page) => router.pathname.startsWith(page));

  if (!mounted) {
    return null;
  }

  if (isNoLayoutPage) {
    return (
      <>
        <Component {...pageProps} />
        <ToastContainer
          position='bottom-right'
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='dark'
        />
      </>
    );
  }

  return (
    <div className='min-h-screen bg-slate-950 text-white'>
      <Header />
      <main className='pt-20'>
        <Component {...pageProps} />
      </main>
      <Footer />
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='dark'
      />
    </div>
  );
}

export default MyApp;
