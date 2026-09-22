/**
 * AuthContext.jsx — Global Authentication State Management
 *
 * Provides authentication state and all auth operations to the entire
 * React component tree via React Context.
 *
 * What it manages:
 *   - user  — { name, email } object for the logged-in user (or null)
 *   - token — JWT string used to authenticate API requests (or null)
 *   - loading — Global loading flag while an auth request is in flight
 *   - isAuthenticated — Derived boolean: true if token is present
 *
 * Persistence:
 *   - token and user are synced to localStorage on every change.
 *   - On page refresh, state is re-hydrated from localStorage (lazy initializers).
 *   - This keeps the user logged in across browser sessions.
 *
 * Offline/Fallback mode:
 *   - If the backend server is not running (fetch error / network error),
 *     each auth function returns a pre-defined simulated success response.
 *   - This allows the frontend to be demoed without a live backend.
 *
 * Exposed via useAuth() hook — import and call anywhere inside AuthProvider.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context — null default ensures useAuth() throws if used outside AuthProvider
const AuthContext = createContext(null);

// Resolve the API base URL from environment variables
// In development: http://localhost:5000/api/auth
// In production:  /api/auth (same origin, served by Express)
const base = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
const API_BASE = `${base}/api/auth`;

/**
 * AuthProvider — Wraps the app and provides auth state/functions via context.
 * Must be a parent of any component that calls useAuth().
 */
export const AuthProvider = ({ children }) => {
  // ── State Initialization with localStorage hydration ───────────────────
  // Lazy initializer functions run only on first mount — avoid stale JSON parse
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [loading, setLoading] = useState(false); // true while any auth API call is in-flight

  // ── Sync token to localStorage whenever it changes ─────────────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token'); // Clear on logout
    }
  }, [token]);

  // ── Sync user object to localStorage whenever it changes ───────────────
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user'); // Clear on logout
    }
  }, [user]);

  // Derived authentication flag — avoids passing both user and token separately
  const isAuthenticated = !!token; // true if token is a non-empty string

  /**
   * makeRequest — Generic POST helper for all auth API calls.
   *
   * Handles:
   *   - Setting the loading flag
   *   - Making the fetch call with JSON headers
   *   - Throwing on non-2xx responses with the server's error message
   *   - Falling back to a simulated response if the backend is unreachable
   *
   * @param {string} url              — Full API endpoint URL
   * @param {Object} data             — Request body data
   * @param {Object} fallbackResponse — Simulated response when backend is offline
   */
  const makeRequest = async (url, data, fallbackResponse) => {
    setLoading(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }
      return result;
    } catch (err) {
      console.warn(`Auth API connection issue at ${url}. Falling back to simulation.`, err);
      // Fallback if backend server is not running or returns a fetch error
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch') || err instanceof TypeError) {
        // Simulate network delay then return the pre-defined fallback response
        await new Promise((resolve) => setTimeout(resolve, 800));
        return fallbackResponse;
      }
      throw err; // Re-throw legitimate server errors (e.g., 400 validation errors)
    } finally {
      setLoading(false); // Always clear loading regardless of success or failure
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // AUTH OPERATIONS
  // ──────────────────────────────────────────────────────────────────────

  /**
   * 1. login — Authenticate with email + password.
   * On success, stores the JWT token and user object in state + localStorage.
   */
  const login = async (email, password) => {
    const fallback = {
      success: true,
      message: 'Logged in successfully (Simulated)',
      token: 'simulated_jwt_token_12345',
      user: { name: email.split('@')[0], email }
    };
    
    const res = await makeRequest(`${API_BASE}/login`, { email, password }, fallback);
    if (res.success && res.token) {
      setToken(res.token); // Triggers localStorage sync via useEffect
      setUser(res.user);
    }
    return res;
  };

  /**
   * 2. loginOTP — Request a passwordless login OTP sent to the user's email.
   * Does not set the token — user must call verifyLoginOTP next.
   */
  const loginOTP = async (email) => {
    const fallback = {
      success: true,
      message: 'Login OTP sent to email (Simulated)',
      email
    };
    return await makeRequest(`${API_BASE}/login-otp`, { email }, fallback);
  };

  /**
   * 3. verifyLoginOTP — Verify the OTP for passwordless login.
   * On success, stores token and user (completes the login flow).
   */
  const verifyLoginOTP = async (email, otp) => {
    const fallback = {
      success: true,
      message: 'Logged in successfully (Simulated)',
      token: 'simulated_jwt_token_otp_12345',
      user: { name: email.split('@')[0], email }
    };
    
    const res = await makeRequest(`${API_BASE}/verify-login-otp`, { email, otp }, fallback);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  /**
   * 4. register — Initiate new account registration.
   * Does NOT log the user in — they must verify their email OTP first.
   */
  const register = async (name, email, password) => {
    const fallback = {
      success: true,
      message: 'Registration initiated. Verification OTP sent to email (Simulated)',
      email
    };
    return await makeRequest(`${API_BASE}/register`, { name, email, password }, fallback);
  };

  /**
   * 5. verifyRegisterOTP — Verify the OTP received after registration.
   * On success, the account is confirmed and the user is automatically logged in.
   */
  const verifyRegisterOTP = async (email, otp) => {
    const fallback = {
      success: true,
      message: 'Email verified successfully. Welcome to AskCare! (Simulated)',
      token: 'simulated_jwt_token_register_12345',
      user: { name: email.split('@')[0], email }
    };
    
    const res = await makeRequest(`${API_BASE}/verify-register`, { email, otp }, fallback);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  /**
   * googleLogin — Authenticate using a Google account (Firebase popup flow).
   * The frontend passes the verified email + display name from Firebase Auth.
   * The backend creates or fetches the user account automatically.
   */
  const googleLogin = async (email, name) => {
    const fallback = {
      success: true,
      message: 'Logged in successfully via Google (Simulated)',
      token: 'simulated_jwt_token_google_12345',
      user: { name, email }
    };
    
    const res = await makeRequest(`${API_BASE}/google-login`, { email, name }, fallback);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  /**
   * 6. resendOTP — Request a new OTP be sent to the user's email.
   * Used on both the registration verification screen and the login OTP screen.
   * The `purpose` ('login' or 'register') controls the email subject line.
   */
  const resendOTP = async (email, purpose) => {
    const fallback = {
      success: true,
      message: 'A new code has been sent to your email (Simulated).'
    };
    return await makeRequest(`${API_BASE}/resend-otp`, { email, purpose }, fallback);
  };

  /**
   * 7. logout — Clears the auth state and localStorage.
   * The Navbar calls navigate('/') with { state: { logout: true } } before calling this,
   * which triggers Home.jsx to call logout() on mount (avoids calling it here directly
   * to prevent redirect loops).
   */
  const logout = () => {
    setToken(null);  // Triggers localStorage.removeItem('token') via useEffect
    setUser(null);   // Triggers localStorage.removeItem('user') via useEffect
  };

  return (
    // Provide all auth state and functions to descendant components
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      login,
      loginOTP,
      verifyLoginOTP,
      register,
      verifyRegisterOTP,
      resendOTP,
      googleLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — Custom hook for consuming the AuthContext.
 * Throws a descriptive error if called outside of AuthProvider.
 * @returns {Object} Auth context value { user, token, isAuthenticated, login, ... }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
