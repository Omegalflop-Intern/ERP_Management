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

  try {
    const rawBranchStorage = localStorage.getItem('branch-storage');
    if (rawBranchStorage) {
      const parsed = JSON.parse(rawBranchStorage);
      const activeBranchId = parsed?.state?.activeBranchId;
      if (activeBranchId && activeBranchId !== 'all') {
        config.headers['X-Branch-Id'] = activeBranchId;
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh for auth endpoints
    if (
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh-token') ||
      originalRequest?.url?.includes('/auth/logout')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const token = res.data?.data?.token;

        if (token) {
          localStorage.setItem('accessToken', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          try {
            const { useAuthStore } = await import('../store/authStore.js');
            useAuthStore.getState().setToken(token);
          } catch {
            // store not available
          }
          processQueue(null, token);
          return api(originalRequest);
        }

        throw new Error('No token returned');
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('branch-storage');
        localStorage.removeItem('omni_last_activity');
        try {
          const { useAuthStore } = await import('../store/authStore.js');
          useAuthStore.setState({ user: null, token: null });
        } catch {
          // ignore
        }
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Uploaded files live on the API server, not the client origin.
  // Prepend SERVER_URL so production correctly loads from api.respawnalley.com/uploads/...
  if (normalizedPath.startsWith('/uploads') && SERVER_URL) {
    return `${SERVER_URL}${normalizedPath}`;
  }

  return normalizedPath;
}

export { API_URL, SERVER_URL };
export default api;
