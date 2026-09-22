/**
 * api.js — Axios HTTP Client Instance
 *
 * Creates a pre-configured Axios instance that all frontend API calls use.
 * Centralizing the Axios config here avoids repeating base URL and auth
 * headers in every component/hook that makes API requests.
 *
 * Base URL resolution:
 *   - VITE_API_URL env variable (set in .env.local) — used in all environments if defined
 *   - Fallback to http://localhost:5000 in Vite development mode (import.meta.env.DEV)
 *   - Fallback to '' (same origin) in production builds — backend served from same domain
 *
 * Request Interceptor (automatic JWT injection):
 *   - Reads the JWT token from localStorage before each request
 *   - Attaches it as "Authorization: Bearer <token>" if present
 *   - No manual header management needed in individual API calls
 *
 * Response Interceptor (automatic 401 handling):
 *   - Catches HTTP 401 Unauthorized responses (expired/invalid token)
 *   - Clears the stale token and user data from localStorage
 *   - Redirects the user to /login (unless already on an auth page)
 *   - Prevents infinite redirect loops by checking the current path first
 */

import axios from 'axios';

// Resolve the backend base URL from environment
const base = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Create a shared Axios instance with the /api prefix baked in
const api = axios.create({
  baseURL: `${base}/api`,
});

// ────────────────────────────────────────────────────────────────────────
// Request Interceptor — Attach JWT token to every outgoing API request
// ────────────────────────────────────────────────────────────────────────
// Intercepts the request config before it is sent. Reads the token from
// localStorage (set by AuthContext on login) and attaches it to the
// Authorization header automatically.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Standard JWT Bearer scheme
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // Pass request-setup errors through unchanged
  }
);

// ────────────────────────────────────────────────────────────────────────
// Response Interceptor — Handle 401 Unauthorized errors globally
// ────────────────────────────────────────────────────────────────────────
// Add a response interceptor to handle 401 Unauthorized errors (e.g. simulated or expired tokens)
// When the backend returns 401, the user's token is expired or invalid.
// We clear the stored credentials and redirect to /login.
api.interceptors.response.use(
  (response) => response, // Pass successful responses through unchanged
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stale auth data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Avoid redirect loop if already on login/register pages
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login'; // Hard redirect to force a clean state
      }
    }
    return Promise.reject(error); // Re-throw so individual call sites can handle other errors
  }
);

export default api;
