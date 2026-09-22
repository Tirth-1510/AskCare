/**
 * firebase.js — Firebase SDK Initialization
 *
 * Initializes the Firebase application and exports the services
 * used for Google OAuth authentication.
 *
 * Services initialized:
 *   - Firebase App   — Core Firebase SDK instance (required by all services)
 *   - Firebase Auth  — Authentication service for handling Google sign-in
 *   - GoogleAuthProvider — Pre-configured OAuth provider for Google sign-in popup
 *
 * Configuration:
 *   All Firebase credentials are loaded from Vite environment variables (.env or .env.local).
 *   These must be set before using Google sign-in. Get values from:
 *   Firebase Console → Project Settings → Your Apps → Web App → Firebase Config
 *
 *   Required .env variables:
 *     VITE_FIREBASE_API_KEY
 *     VITE_FIREBASE_AUTH_DOMAIN
 *     VITE_FIREBASE_PROJECT_ID
 *     VITE_FIREBASE_STORAGE_BUCKET
 *     VITE_FIREBASE_MESSAGING_SENDER_ID
 *     VITE_FIREBASE_APP_ID
 *
 * GoogleAuthProvider settings:
 *   prompt: 'select_account' — Forces the Google account picker to appear every time,
 *   even if the user is already signed into Google in their browser. This prevents
 *   accidentally logging in with the wrong Google account.
 *
 * Usage (in Login.jsx / Register.jsx):
 *   import { auth, googleProvider } from '../utils/firebase';
 *   const result = await signInWithPopup(auth, googleProvider);
 *   → result.user.email, result.user.displayName
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase project configuration — values loaded from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase with the project config
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
const auth = getAuth(app);

// Create and configure the Google OAuth provider
const googleProvider = new GoogleAuthProvider();
// Always show account picker — prevents silently using a cached Google session
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, googleProvider };
