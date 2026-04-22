import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Inter, Tajawal, Cairo } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteProgress from "@/components/RouteProgress";
import { ToastContainer } from "react-toastify";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import { cartAPI, wishlistAPI, authAPI } from "@/utils/endpoints";
import { useI18n } from "@/utils/i18n";
import { getSocket, reconnectSocket } from "@/utils/socket";

// next/font self-hosts the fonts at build time, preloads the files on the
// initial HTML, and exposes them as CSS variables. This removes the blocking
// request to fonts.googleapis.com and gets rid of the FOIT that used to show
// Times New Roman for a beat on slow connections.
// `display: swap` lets the browser render with fallback glyphs first.
// `preload: false` on the non-primary fonts keeps the critical path small.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-arabic",
  preload: false,
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-arabic-heading",
  preload: false,
});

// Client-only wrapper: useRouter must not run during SSG/prerender.
// This component is only rendered after mount, so router is available.
function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { isAuthenticated, setUser, setTokens, setHydrated } = useAuthStore();
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
        })
        .finally(() => setHydrated(true));
    } else {
      // No token to restore — auth state is already final.
      setHydrated(true);
    }

    // The cart is now persisted by zustand under the 'lp-cart' key with its
    // own rehydration. The legacy 'cart' key was an older parallel store;
    // reading it here would *clobber* the freshly-hydrated zustand state
    // with an empty {items:[]} on every navigation (the bug the QA round
    // labelled B-17). Just remove the stale key once and stop reading it.
    if (typeof window !== 'undefined' && localStorage.getItem('cart')) {
      localStorage.removeItem('cart');
    }
  }, [setTokens, setUser, setHydrated]);

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
      </Head>
      <div className={`${inter.variable} ${tajawal.variable} ${cairo.variable}`}>
        <AppContent Component={Component} pageProps={pageProps} />
      </div>
    </>
  );
}

export default MyApp;
