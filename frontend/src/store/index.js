import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  tokens: null,
  hydrated: false, // becomes true once we've tried to restore a session — lets
                   // guarded pages avoid racing the very-first render.

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (tokens) => set({ tokens }),
  setHydrated: (v = true) => set({ hydrated: v }),
  logout: () => {
    set({ user: null, isAuthenticated: false, tokens: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      localStorage.removeItem('auth');
      localStorage.removeItem('tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    useCartStore.getState().clearCart();
    useWishlistStore.getState().clearWishlist();
  },
}));

/**
 * Cart store persisted to localStorage so a guest's cart survives navigation
 * and refresh. Once the user logs in, cart.get from the server hydrates
 * authoritative server state on top.
 */
export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          const newItems = existing
            ? state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i,
              )
            : [...state.items, { ...item, quantity: item.quantity || 1 }];
          return {
            items: newItems,
            itemCount: newItems.reduce((s, i) => s + i.quantity, 0),
            total: newItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
          };
        }),

      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.productId !== productId);
          return {
            items: newItems,
            itemCount: newItems.reduce((s, i) => s + i.quantity, 0),
            total: newItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          const newItems = state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          );
          return {
            items: newItems,
            itemCount: newItems.reduce((s, i) => s + i.quantity, 0),
            total: newItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
          };
        }),

      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
      setCart: (cart) =>
        set({
          items: cart.items || [],
          total: cart.total || 0,
          itemCount: (cart.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
        }),
    }),
    {
      name: 'lp-cart',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : null)),
      // Persist only the cart data, not function refs.
      partialize: (state) => ({ items: state.items, total: state.total, itemCount: state.itemCount }),
    },
  ),
);

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return {};
          return { items: [...state.items, item], itemCount: state.itemCount + 1 };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
          itemCount: Math.max(0, state.itemCount - 1),
        })),

      isInWishlist: (productId) => get().items.some((i) => i.productId === productId),

      clearWishlist: () => set({ items: [], itemCount: 0 }),
      setWishlist: (wishlist) =>
        set({
          items: wishlist.items || [],
          itemCount: (wishlist.items || []).length,
        }),
    }),
    {
      name: 'lp-wishlist',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : null)),
      partialize: (state) => ({ items: state.items, itemCount: state.itemCount }),
    },
  ),
);

export const useUIStore = create((set) => ({
  isDarkMode: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
}));
