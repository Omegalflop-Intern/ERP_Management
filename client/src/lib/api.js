import axios from 'axios';

// Get API URL from environment variable (.env)
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Compute base server URL (without /api/v1) for serving uploads/assets
const SERVER_URL = API_URL ? API_URL.replace(/\/api\/v1\/?$/, '') : '';

// Create centralized Axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach bearer token if present in localStorage (backward compat)
// The server now also sets accessToken as an httpOnly cookie — sent via withCredentials automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle automatic 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token is in httpOnly cookie — sent automatically with withCredentials
        const res = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { token } = res.data.data;
        if (token) {
          localStorage.setItem('accessToken', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          // Update Zustand store so SSE and other consumers get the new token
          try {
            const { useAuthStore } = await import('../store/authStore.js');
            useAuthStore.getState().setToken(token);
          } catch {
            // Ignore if store isn't available
          }
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to resolve media asset URLs dynamically
// Always returns relative path so requests go through Vite proxy (HTTPS-safe, no mixed content)
export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:')) return path;

  // Already an absolute external URL (CDN, external storage, etc.) — return as-is
  // But for localhost URLs, strip the origin and return relative so proxy handles it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      const isLocal =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.startsWith('192.168.');
      // Return relative path for local URLs → goes through Vite proxy (HTTPS-safe)
      if (isLocal) return url.pathname;
    } catch {
      // Not a valid URL — fall through
    }
    return path; // External URL — return as-is
  }

  // Relative or path-only — ensure it starts with /
  return path.startsWith('/') ? path : `/${path}`;
}

export { API_URL, SERVER_URL };
export default api;
