import axios from 'axios';

export const TOKEN_KEY = 'cpm_portal_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

// Deployed backend is the default so the app never silently points at localhost.
// Override with VITE_API_URL (e.g. http://localhost:5000/api when running the backend locally).
const DEFAULT_API_URL = 'https://backend-nine-xi-82.vercel.app/api';

const resolveBaseUrl = () => {
  const raw = String(import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/+$/, '');
  return /\/api$/i.test(raw) ? raw : `${raw}/api`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isAuthCall = error?.config?.url?.includes('/auth/login');
    if (status === 401 && !isAuthCall) {
      clearStoredToken();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
