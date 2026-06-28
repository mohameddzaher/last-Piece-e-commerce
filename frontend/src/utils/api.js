import axios from 'axios';

// Default: Render. For local backend set NEXT_PUBLIC_API_URL=http://localhost:5001/api in .env.local
const PRODUCTION_API = 'https://last-piece-4l3u.onrender.com/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API;

const apiClient = axios.create({
  baseURL: API_URL,
  // Send the httpOnly auth cookies when frontend + backend share a domain.
  // Cross-origin (Netlify ↔ Render) falls back to the Bearer header below.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single in-flight refresh shared by all 401s, so a burst of concurrent
// requests after the access token expires triggers exactly ONE refresh call
// (no stampede) and they all retry once it resolves.
let refreshPromise = null;

const forceLogout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Avoid redirect loops if we're already on the login page.
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
};

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh the refresh call itself (avoids infinite loop).
    const isAuthCall = originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, { refreshToken })
            .then((res) => {
              const tokens = res.data?.data?.tokens;
              if (!tokens?.accessToken) throw new Error('No token in refresh response');
              localStorage.setItem('accessToken', tokens.accessToken);
              if (tokens.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);
              return tokens.accessToken;
            })
            .finally(() => { refreshPromise = null; });
        }
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
