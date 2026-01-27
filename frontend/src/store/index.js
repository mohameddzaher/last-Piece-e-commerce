import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  tokens: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (tokens) => set({ tokens }),
  logout: () => {
    // Clear auth state
    set({ user: null, isAuthenticated: false, tokens: null });

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      localStorage.removeItem('auth');
      localStorage.removeItem('tokens');
    }

    // Clear cart and wishlist stores
    useCartStore.getState().clearCart();
    useWishlistStore.getState().clearWishlist();
  },
}));

export const useCartStore = create((set) => ({
  items: [],
  total: 0,
  itemCount: 0,

  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((i) => i.productId === item.productId);
      let newItems;

      if (existingItem) {
        newItems = state.items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        newItems = [...state.items, item];
      }

      return {
        items: newItems,
        itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    }),

  removeItem: (productId) =>
    set((state) => {
      const newItems = state.items.filter((i) => i.productId !== productId);
      return {
        items: newItems,
        itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      const newItems = state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
      return {
        items: newItems,
        itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    }),

  clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
  setCart: (cart) =>
    set({
      items: cart.items,
      total: cart.total,
      itemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    }),
}));

export const useWishlistStore = create((set, get) => ({
  items: [],
  itemCount: 0,

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
      itemCount: state.itemCount + 1,
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
      itemCount: state.itemCount - 1,
    })),

  isInWishlist: (productId) => {
    const state = get();
    return state.items.some((i) => i.productId === productId);
  },

  clearWishlist: () => set({ items: [], itemCount: 0 }),

  setWishlist: (wishlist) =>
    set({
      items: wishlist.items,
      itemCount: wishlist.items.length,
    }),
}));

export const useUIStore = create((set) => ({
  isDarkMode: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
}));
