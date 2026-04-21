import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteProgress from "@/components/RouteProgress";
import { ToastContainer } from "react-toastify";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import { cartAPI, wishlistAPI, authAPI } from "@/utils/endpoints";
import { useI18n } from "@/utils/i18n";
import { getSocket, reconnectSocket } from "@/utils/socket";

// Client-only wrapper: useRouter must not run during SSG/prerender.
// This component is only rendered after mount, so router is available.
function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { isAuthenticated, setUser, setTokens } = useAuthStore();
  const setCart = useCartStore((state) => state.setCart);
  const setWishlist = useWishlistStore((state) => state.setWishlist);
  const initI18n = useI18n((s) => s.init);

  // i18n is already initialized synchronously at module load (translations
  // are bundled). This effect just syncs `lang`/`dir` onto <html> after mount
  // and schedules the socket connection off the critical boot path so the
  // first paint isn't competing with the WebSocket handshake.
  useEffect(() => {
    initI18n();
    const idle = (cb) =>
      (typeof window !== 'undefined' && window.requestIdleCallback
        ? window.requestIdleCallback(cb, { timeout: 600 })
        : setTimeout(cb, 400));
    const handle = idle(() => { getSocket(); });
    return () => {
      if (typeof window !== 'undefined' && window.cancelIdleCallback && typeof handle === 'number') {
        try { window.cancelIdleCallback(handle); } catch {}
      } else {
        clearTimeout(handle);
      }
    };
  }, [initI18n]);

  useEffect(() => {
    // Check for saved tokens and restore session
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
      authAPI
        .getProfile()
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.data);
            // Reconnect socket so the handshake includes the auth token
            reconnectSocket();
          }
        })
        .catch((err) => {
          console.error("Error fetching profile:", err);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        });
    }

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  }, [setTokens, setUser, setCart]);

  useEffect(() => {
    if (isAuthenticated) {
      cartAPI
        .get()
        .then((res) => {
          if (res.data.success && res.data.data) setCart(res.data.data);
        })
        .catch((err) => console.error("Error fetching cart:", err));
      wishlistAPI
        .get()
        .then((res) => {
          if (res.data.success && res.data.data) setWishlist(res.data.data);
        })
        .catch((err) => console.error("Error fetching wishlist:", err));
    }
  }, [isAuthenticated, setCart, setWishlist]);

  const isNoLayoutPage = router.pathname.startsWith("/admin");

  if (isNoLayoutPage) {
    return (
      <>
        <Component {...pageProps} />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <RouteProgress />
      <Header />
      <main className="pt-16">
        <Component {...pageProps} />
      </main>
      <Footer />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  // NOTE: we used to gate AppContent behind a "mounted" flag to avoid SSR
  // issues. That caused a visible flash on page refresh — a new, valid frame
  // appears, then the client takes over and re-renders. Removed: useRouter
  // and our zustand stores are safe during SSR, so render immediately.
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0F172A" />
        <meta
          name="description"
          content="Last Piece — Khaleeji luxury sneakers. Authentic, limited, one-of-a-kind."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <AppContent Component={Component} pageProps={pageProps} />
    </>
  );
}

export default MyApp;
