import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const SERVER_URL = API_URL ? API_URL.replace(/\/api\/v1\/?$/, '') : '';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const { token } = res.data.data;

        if (token) {
          localStorage.setItem('accessToken', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          try {
            const { useAuthStore } = await import('../store/authStore.js');
            useAuthStore.getState().setToken(token);
          } catch {
            // store not available
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

export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:')) return path;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      const isLocal =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.startsWith('192.168.');
      if (isLocal) return url.pathname;
    } catch {
      // not a valid URL
    }
    return path;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export { API_URL, SERVER_URL };
export default api;
