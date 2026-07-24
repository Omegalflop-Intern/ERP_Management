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
        // Update localStorage token for Bearer header compat
        if (token) {
          localStorage.setItem('accessToken', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
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
export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;

  // Ensure path starts with a single forward slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (SERVER_URL) {
    return `${SERVER_URL}${cleanPath}`;
  }

  // Fallback for dev environment
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isDev) {
    return `http://localhost:5000${cleanPath}`;
  }

  return cleanPath;
}

export { API_URL, SERVER_URL };
export default api;
