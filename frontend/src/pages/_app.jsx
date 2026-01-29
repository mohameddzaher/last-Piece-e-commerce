import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastContainer } from "react-toastify";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import { cartAPI, wishlistAPI, authAPI } from "@/utils/endpoints";

// Client-only wrapper: useRouter must not run during SSG/prerender.
// This component is only rendered after mount, so router is available.
function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { isAuthenticated, setUser, setTokens } = useAuthStore();
  const setCart = useCartStore((state) => state.setCart);
  const setWishlist = useWishlistStore((state) => state.setWishlist);

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

  const noLayoutPages = [
    "/admin",
    "/admin/products",
    "/admin/orders",
    "/admin/users",
  ];
  const isNoLayoutPage = noLayoutPages.some((page) =>
    router.pathname.startsWith(page),
  );

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
      <Header />
      <main className="pt-20">
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default document meta (no custom _document to avoid Netlify "Html outside _document" error)
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0F172A" />
        <meta
          name="description"
          content="Last Piece - Discover unique, one-of-a-kind products"
        />
      </Head>
      {!mounted ? null : (
        <AppContent Component={Component} pageProps={pageProps} />
      )}
    </>
  );
}

export default MyApp;
