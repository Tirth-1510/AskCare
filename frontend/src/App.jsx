/**
 * App.jsx — Root Application Component
 *
 * Sets up the global provider tree and the client-side routing structure.
 *
 * Architecture:
 *   AuthProvider  — Wraps the entire app to provide authentication state
 *                   (user, token, login/logout functions) via React Context.
 *   Router        — BrowserRouter enables HTML5 history-based navigation.
 *   ScrollToTop   — Utility component that scrolls to the top (or a hash anchor)
 *                   on every route change.
 *   Suspense       — React.lazy() is used for all pages to enable code splitting.
 *                   Each page is loaded on-demand when first visited, reducing
 *                   the initial bundle size. PageLoader is shown while loading.
 *
 * Route categories:
 *   Public routes  — Accessible without authentication (/, /about, /contact, /login, /register)
 *   Protected routes — Wrapped in <ProtectedRoute> which redirects to /login if no token:
 *                       /chat, /history, /profile
 *   Fallback route — Any unmatched path redirects to / (home page)
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// ────────────────────────────────────────────────────────────────────────
// Lazy-loaded Pages
// ────────────────────────────────────────────────────────────────────────
// React.lazy() + Suspense enables code splitting: each page is bundled
// into its own chunk and only downloaded when the user navigates to it.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Chat = lazy(() => import('./pages/Chat'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));

// ────────────────────────────────────────────────────────────────────────
// PageLoader — Shown while a lazy-loaded page chunk is downloading
// ────────────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen w-full bg-[#0B0E14] text-white flex items-center justify-center font-sans">
    <div className="flex flex-col items-center gap-3">
      {/* Spinning neon ring — AskCare brand color */}
      <div className="w-10 h-10 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-gray-400 font-medium tracking-wide">Loading AskCare...</p>
    </div>
  </div>
);

function App() {
  return (
    // AuthProvider must wrap the entire router so auth state is available everywhere
    <AuthProvider>
      <Router>
        {/* ScrollToTop resets scroll position on route change and handles hash anchors */}
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public Routes ──────────────────────────────── */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />  {/* Redirect /home → / */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Protected Routes (require valid JWT token) ─── */}
            {/* ProtectedRoute checks isAuthenticated and redirects to /login if false */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* ── Fallback Route — redirect any unknown path to home ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
