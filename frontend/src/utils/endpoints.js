import apiClient from './api';

// Auth endpoints
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  verifyEmail: (data) => apiClient.post('/auth/verify-email', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

// Product endpoints
export const productAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getBySlug: (slug) => apiClient.get(`/products/${slug}`),
  search: (query, limit) => apiClient.get('/products/search', { params: { query, limit } }),
  getRelated: (id, limit) => apiClient.get(`/products/${id}/related`, { params: { limit } }),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
  // Last Piece pipeline
  getInventory: (bucket) => apiClient.get(`/products/inventory/${bucket}`),
  bulkLocation: (data) => apiClient.post('/products/bulk/location', data),
};

export const brandAPI = {
  getAll: (params) => apiClient.get('/brands', { params }),
  getBySlug: (slug) => apiClient.get(`/brands/${slug}`),
  create: (data) => apiClient.post('/brands', data),
  update: (id, data) => apiClient.put(`/brands/${id}`, data),
  delete: (id) => apiClient.delete(`/brands/${id}`),
};

export const shipmentAPI = {
  getAll: (params) => apiClient.get('/shipments', { params }),
  getById: (id) => apiClient.get(`/shipments/${id}`),
  create: (data) => apiClient.post('/shipments', data),
  update: (id, data) => apiClient.put(`/shipments/${id}`, data),
  delete: (id) => apiClient.delete(`/shipments/${id}`),
};

export const expenseAPI = {
  getAll: (params) => apiClient.get('/expenses', { params }),
  create: (data) => apiClient.post('/expenses', data),
  update: (id, data) => apiClient.put(`/expenses/${id}`, data),
  delete: (id) => apiClient.delete(`/expenses/${id}`),
  summaryByCategory: (params) => apiClient.get('/expenses/summary/by-category', { params }),
};

export const saleAPI = {
  getAll: (params) => apiClient.get('/sales', { params }),
  create: (data) => apiClient.post('/sales', data),
};

export const promoCodeAPI = {
  getAll: () => apiClient.get('/promo-codes'),
  validate: (data) => apiClient.post('/promo-codes/validate', data),
  create: (data) => apiClient.post('/promo-codes', data),
  update: (id, data) => apiClient.put(`/promo-codes/${id}`, data),
  delete: (id) => apiClient.delete(`/promo-codes/${id}`),
};

export const referralAPI = {
  getMine: () => apiClient.get('/referrals/me'),
  validate: (code) => apiClient.get(`/referrals/validate/${code}`),
  getAll: () => apiClient.get('/referrals'),
};

export const siteContentAPI = {
  getAll: (params) => apiClient.get('/site-content', { params }),
  getByKey: (key, lang) => apiClient.get(`/site-content/by-key/${key}`, { params: { lang } }),
  adminAll: () => apiClient.get('/site-content/admin/all'),
  upsert: (key, data) => apiClient.put(`/site-content/${key}`, data),
  delete: (key) => apiClient.delete(`/site-content/${key}`),
};

export const fxAPI = {
  current: (from = 'SAR', to = 'EGP') => apiClient.get('/fx/current', { params: { from, to } }),
  history: (from = 'SAR', to = 'EGP', days = 30) => apiClient.get('/fx/history', { params: { from, to, days } }),
  impact: () => apiClient.get('/fx/impact'),
  // "Reference rate" — the locked book rate used as default for new purchases.
  getReferences: (params) => apiClient.get('/fx/reference', { params }),
  updateReference: (data) => apiClient.put('/fx/reference', data),
  referenceHistory: (from = 'SAR', to = 'EGP') =>
    apiClient.get('/fx/reference/history', { params: { from, to } }),
};

// Cart endpoints
export const cartAPI = {
  get: () => apiClient.get('/cart'),
  add: (data) => apiClient.post('/cart/add', data),
  remove: (data) => apiClient.post('/cart/remove', data),
  update: (data) => apiClient.put('/cart/update', data),
  clear: () => apiClient.delete('/cart/clear'),
  applyCoupon: (data) => apiClient.post('/cart/apply-coupon', data),
};

// Order endpoints
export const orderAPI = {
  create: (data) => apiClient.post('/orders', data),
  getAll: (params) => apiClient.get('/orders', { params }),
  getById: (id) => apiClient.get(`/orders/${id}`),
  updateStatus: (id, data) => apiClient.put(`/orders/${id}/status`, data),
  cancel: (id) => apiClient.put(`/orders/${id}/cancel`),
  // Public tracking — no auth needed, matches orderNumber + email.
  track: (data) => apiClient.post('/orders/track', data),
};

// Wishlist endpoints
export const wishlistAPI = {
  get: () => apiClient.get('/wishlist'),
  add: (data) => apiClient.post('/wishlist/add', data),
  remove: (data) => apiClient.post('/wishlist/remove', data),
  clear: () => apiClient.delete('/wishlist/clear'),
};

// Category endpoints
export const categoryAPI = {
  getAll: () => apiClient.get('/categories'),
  getBySlug: (slug) => apiClient.get(`/categories/${slug}`),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`),
};

// Review endpoints
export const reviewAPI = {
  // Public
  getFeatured: () => apiClient.get('/reviews/featured'),
  getProductReviews: (productId, params) => apiClient.get(`/reviews/product/${productId}`, { params }),

  // User
  create: (data) => apiClient.post('/reviews', data),

  // Admin
  getAll: (params) => apiClient.get('/reviews/admin', { params }),
  updateStatus: (id, status) => apiClient.put(`/reviews/${id}/status`, { status }),
  toggleFeatured: (id) => apiClient.put(`/reviews/${id}/featured`),
  delete: (id) => apiClient.delete(`/reviews/${id}`),
};

// Admin endpoints
export const adminAPI = {
  // Dashboard
  getStats: () => apiClient.get('/admin/dashboard/stats'),

  // Users
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getUser: (userId) => apiClient.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => apiClient.put(`/admin/users/${userId}`, data),
  updateUserRole: (userId, role) => apiClient.put(`/admin/users/${userId}/role`, { role }),
  blockUser: (userId) => apiClient.put(`/admin/users/${userId}/block`),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),

  // Orders
  getOrders: (params) => apiClient.get('/admin/orders', { params }),
  getOrderById: (id) => apiClient.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => apiClient.put(`/orders/${id}/status`, { status }),

  // Super Admin Only
  getSuperAdminStats: () => apiClient.get('/admin/super/stats'),
  getFinancialReport: (params) => apiClient.get('/admin/super/financial-report', { params }),
  getSystemSettings: () => apiClient.get('/admin/super/settings'),
  updateSystemSettings: (data) => apiClient.put('/admin/super/settings', data),

  // Export (Super Admin Only)
  exportProducts: () => apiClient.get('/admin/export/products', { responseType: 'blob' }),
  exportUsers: () => apiClient.get('/admin/export/users', { responseType: 'blob' }),
  exportOrders: () => apiClient.get('/admin/export/orders', { responseType: 'blob' }),
};

// Upload endpoints
export const uploadAPI = {
  uploadSingle: (formData) => apiClient.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadMultiple: (formData) => apiClient.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFile: (filename) => apiClient.delete(`/upload/${filename}`),
};
