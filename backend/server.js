/**
 * server.js — AskCare Express API Server
 *
 * This is the main entry point for the Node.js/Express backend.
 * It handles:
 *   - JWT-based authentication (register, login, OTP, Google OAuth)
 *   - OTP email delivery via nodemailer (mailer.js)
 *   - Dual-database support: MongoDB Atlas (production) or local db.json (fallback)
 *   - Mounting of chat and document feature routes
 *   - Serving the built React frontend in production (single-server deployment)
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');      // Password hashing library
const jwt = require('jsonwebtoken');     // JSON Web Token for session management
const mongoose = require('mongoose');    // MongoDB ODM
require('dotenv').config();             // Load .env variables into process.env

const db = require('./db');                                     // Local JSON file-based fallback database
const User = require('./models/User');                          // Mongoose User model
const { generateOTP, sendOTPEmail } = require('./mailer');      // OTP generation and email sending

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';  // Secret key for signing JWTs
const MONGODB_URI = process.env.MONGODB_URI || '';

// ────────────────────────────────────────────────────────────────────────
// CORS & Body Parsing Middleware
// ────────────────────────────────────────────────────────────────────────
// Allow all origins (adjust for production to restrict to your frontend domain)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json()); // Parse incoming JSON request bodies

// ────────────────────────────────────────────────────────────────────────
// Database Mode Detection
// ────────────────────────────────────────────────────────────────────────
// If MONGODB_URI is missing or still a placeholder, fall back to local db.json
const isMongoPlaceholder = !MONGODB_URI || MONGODB_URI.includes('cluster0.xxxxx.mongodb.net');
const useMongo = !isMongoPlaceholder; // true = Atlas, false = local JSON file

let cachedConnection = null; // Cached Mongoose connection for serverless re-use

/**
 * connectDB — Lazily connect to MongoDB Atlas.
 * Caches the connection to avoid reconnecting on every serverless invocation.
 */
const connectDB = async () => {
  if (!useMongo) return null; // Skip if using local fallback

  // Already connected — reuse the existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  console.log('⏳ Connecting to MongoDB Atlas...');
  try {
    cachedConnection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) to prevent serverless function hang
    });
    console.log('✅ Connected to MongoDB Atlas successfully.');
    return cachedConnection;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    cachedConnection = null;
    throw err;
  }
};

// Log which DB mode is active on startup (local development helper)
if (!useMongo) {
  console.log('\n=============================================');
  console.log(' DATABASE NOTICE: MONGODB_URI is empty or placeholder.');
  console.log(' STATUS: Operating in Local Fallback DB Mode (db.json)');
  console.log(' TIP: Add MongoDB Atlas connection string in .env to switch to Atlas.');
  console.log('=============================================\n');
}

// ────────────────────────────────────────────────────────────────────────
// DB Connection Guard Middleware
// ────────────────────────────────────────────────────────────────────────
// Ensures MongoDB is connected before any /api/* request is processed.
// Skips /api/diagnostics to allow health checks even if DB is down.
app.use(async (req, res, next) => {
  if (useMongo && req.path.startsWith('/api') && req.path !== '/api/diagnostics') {
    try {
      await connectDB();
      next();
    } catch (err) {
      console.error('Database connection middleware error:', err.message);
      res.status(500).json({
        success: false,
        message: 'Database connection failed. Please ensure MongoDB Atlas Network Access allows requests from Vercel (IP 0.0.0.0/0).',
        error: err.message
      });
    }
  } else {
    next();
  }
});

// ────────────────────────────────────────────────────────────────────────
// Unified Database Helper
// ────────────────────────────────────────────────────────────────────────
// Provides a consistent API surface that routes to either MongoDB or local db.json.
// All auth routes use these helpers — they never call Mongoose or db directly.
const dbHelper = {
  /**
   * Find a user document by email address (case-insensitive).
   */
  findUserByEmail: async (email) => {
    if (useMongo) {
      return await User.findOne({ email: email.toLowerCase() });
    } else {
      return db.findUserByEmail(email);
    }
  },

  /**
   * Create and persist a new user document.
   */
  createUser: async (userData) => {
    if (useMongo) {
      const newUser = new User({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        isVerified: userData.isVerified || false,
        otp: userData.otp,
        otpExpires: userData.otpExpires
      });
      return await newUser.save();
    } else {
      return db.createUser(userData);
    }
  },

  /**
   * Apply partial field updates to a user document identified by email.
   */
  updateUser: async (email, updates) => {
    if (useMongo) {
      return await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        updates,
        { new: true } // Return the updated document
      );
    } else {
      return db.updateUser(email, updates);
    }
  },

  /**
   * Delete all unverified users whose OTP has expired (periodic cleanup).
   * Keeps the users collection from accumulating abandoned registrations.
   */
  cleanupExpiredUsers: async () => {
    const now = new Date();
    if (useMongo) {
      const result = await User.deleteMany({
        isVerified: false,
        otpExpires: { $lt: now }  // OTP expiry is in the past
      });
      return result.deletedCount;
    } else {
      return db.deleteExpiredUnverifiedUsers(now);
    }
  }
};

// ════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────
// 0. Diagnostics Endpoint — GET /api/diagnostics
// ────────────────────────────────────────────────────────────────────────
// Returns a JSON snapshot of the server's environment and database state.
// Useful for quickly debugging deployment issues on Vercel.
app.get('/api/diagnostics', async (req, res) => {
  const fs = require('fs');
  const path = require('path');

  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      PORT: process.env.PORT,
      HAS_MONGODB_URI: !!process.env.MONGODB_URI,
      HAS_JWT_SECRET: !!process.env.JWT_SECRET,
      HAS_SMTP_USER: !!process.env.SMTP_USER,
      HAS_SMTP_PASS: !!process.env.SMTP_PASS,
      HAS_SMOLLM_API_KEY: !!process.env.SMOLLM_API_KEY,
    },
    database: {
      mode: useMongo ? 'MongoDB Atlas' : 'Local Fallback (db.json)',
      connectionState: useMongo ? mongoose.connection.readyState : 'N/A',
      connectionStateString: useMongo ? ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] : 'N/A',
    }
  };

  // Ping MongoDB to confirm liveness (only if connected)
  if (useMongo) {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        diagnostics.database.ping = 'success';
      } else {
        diagnostics.database.ping = 'no connection db object yet';
      }
    } catch (err) {
      diagnostics.database.ping = 'failed';
      diagnostics.database.pingError = err.message;
    }
  }

  // Test local filesystem write access (useful for Vercel troubleshooting)
  try {
    const tempFilePath = path.join('/tmp', `write-test-${Date.now()}.txt`);
    fs.writeFileSync(tempFilePath, 'write test');
    fs.unlinkSync(tempFilePath);
    diagnostics.fileSystem = { writeTempDir: 'success' };
  } catch (err) {
    diagnostics.fileSystem = { writeTempDir: 'failed', error: err.message };
  }

  res.json(diagnostics);
});

// ────────────────────────────────────────────────────────────────────────
// 1. Register User — POST /api/auth/register
// ────────────────────────────────────────────────────────────────────────
// Flow:
//   a. Clean up any expired unverified users to avoid stale records.
//   b. If email already registered and verified → reject (duplicate).
//   c. If email registered but unverified → overwrite OTP and resend.
//   d. Otherwise → hash password, create user, send verification OTP.
// The user is NOT logged in yet; they must verify via /api/auth/verify-register.
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
  }

  try {
    // Clean up expired unverified users first
    await dbHelper.cleanupExpiredUsers().catch(err => {
      console.error('Error during inline expired users cleanup:', err);
    });

    const existingUser = await dbHelper.findUserByEmail(email);

    // Generate a 6-digit OTP valid for 5 minutes
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (existingUser) {
      if (existingUser.isVerified) {
        // Email already in use by a verified account → reject
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // User exists but is unverified (e.g. previous registration attempt) → refresh OTP
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      await dbHelper.updateUser(email, {
        name,
        password: hashedPassword,
        otp,
        otpExpires
      });

      const emailResult = await sendOTPEmail(email, otp, 'Registration Verification');
      if (emailResult.error) {
        console.warn('Registration OTP email warning:', emailResult.error);
      }
      return res.json({ success: true, message: 'Verification OTP sent to email', email });
    }

    // Hash Password before storing (never store plain text)
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create user record in unverified state
    await dbHelper.createUser({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpires
    });

    const emailResult = await sendOTPEmail(email, otp, 'Registration Verification');
    if (emailResult.error) {
      console.warn('Registration OTP email warning:', emailResult.error);
    }

    res.json({ success: true, message: 'Registration initiated. Verification OTP sent to email', email });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// 2. Verify Registration OTP — POST /api/auth/verify-register
// ────────────────────────────────────────────────────────────────────────
// Validates the 6-digit OTP the user received via email after registering.
// On success: marks account as verified, clears OTP, issues a JWT token.
app.post('/api/auth/verify-register', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide email and OTP code' });
  }

  try {
    const user = await dbHelper.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Validate OTP: must match and not be expired
    if (user.otp !== otp || Date.now() > new Date(user.otpExpires).getTime()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Mark as verified and clear OTP fields
    await dbHelper.updateUser(email, {
      isVerified: true,
      otp: null,
      otpExpires: null
    });

    // Issue a JWT token valid for 7 days so the user is immediately logged in
    const token = jwt.sign({ id: user._id || user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to AskCare!',
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verify registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// 3. Password Login — POST /api/auth/login
// ────────────────────────────────────────────────────────────────────────
// Traditional email + password login.
// Checks that the account exists, is verified, and bcrypt matches.
// Returns a 7-day JWT on success.
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const user = await dbHelper.findUserByEmail(email);
    if (!user) {
      // Return generic message to avoid email enumeration attacks
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please verify your email first.',
        needsVerification: true,
        email: user.email
      });
    }

    // Compare the submitted plain-text password against the bcrypt hash
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id || user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// 4. Request Passwordless OTP Login — POST /api/auth/login-otp
// ────────────────────────────────────────────────────────────────────────
// Sends a one-time login code to the user's verified email.
// No password required — useful for users who prefer magic-link-style auth.
app.post('/api/auth/login-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide your email address' });
  }

  try {
    const user = await dbHelper.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email address not registered. Please sign up first.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please complete verification first.',
        needsVerification: true,
        email: user.email
      });
    }

    // Generate a fresh OTP valid for 5 minutes and persist it
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await dbHelper.updateUser(email, {
      otp,
      otpExpires
    });

    const emailResult = await sendOTPEmail(email, otp, 'Login Authentication');
    if (emailResult.error) {
      console.warn('Login OTP email warning:', emailResult.error);
    }

    res.json({ success: true, message: 'Login OTP sent to email', email });
  } catch (error) {
    console.error('Login OTP request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP code', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// 5. Verify Passwordless OTP Login — POST /api/auth/verify-login-otp
// ────────────────────────────────────────────────────────────────────────
// Validates the magic-link OTP and, on success, issues a JWT session token.
// The OTP is cleared after use to prevent replay attacks.
app.post('/api/auth/verify-login-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide email and OTP code' });
  }

  try {
    const user = await dbHelper.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate OTP: both value match and expiry check
    if (user.otp !== otp || Date.now() > new Date(user.otpExpires).getTime()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Clear OTP after successful verification (single-use)
    await dbHelper.updateUser(email, {
      otp: null,
      otpExpires: null
    });

    const token = jwt.sign({ id: user._id || user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// Google Login / Registration — POST /api/auth/google-login
// ────────────────────────────────────────────────────────────────────────
// Handles Google OAuth sign-in from the frontend (Firebase Google popup flow).
// The frontend already authenticated with Google and passes the verified email + name.
// Logic:
//   - If user doesn't exist → auto-create with a random password (Google-only account).
//   - If user exists but unverified → mark as verified (Google email is already trusted).
//   - Always returns a JWT session token.
app.post('/api/auth/google-login', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Please provide Google email and name' });
  }

  try {
    let user = await dbHelper.findUserByEmail(email);

    if (!user) {
      // Create user if not exists, verify them immediately since they auth'd with Google
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(Math.random().toString(36), salt); // Random password — not used for login
      user = await dbHelper.createUser({
        name,
        email,
        password: hashedPassword,
        isVerified: true // Google emails are verified by definition
      });
    } else if (!user.isVerified) {
      // If user exists but is not verified, verify them since Google email is verified
      user = await dbHelper.updateUser(email, { isVerified: true });
    }

    const token = jwt.sign({ id: user._id || user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google authentication', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// 6. Resend OTP — POST /api/auth/resend-otp
// ────────────────────────────────────────────────────────────────────────
// Generates and sends a fresh OTP to the user's email.
// Used by both the registration verification screen and the OTP login screen.
// The `purpose` field distinguishes which subject line to use in the email.
app.post('/api/auth/resend-otp', async (req, res) => {
  const { email, purpose } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide your email address' });
  }

  try {
    const user = await dbHelper.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a new 5-minute OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await dbHelper.updateUser(email, {
      otp,
      otpExpires
    });

    // Use different email subjects for login vs registration
    const emailPurpose = purpose === 'login' ? 'Login Authentication' : 'Registration Verification';
    const emailResult = await sendOTPEmail(email, otp, emailPurpose);
    if (emailResult.error) {
      console.warn('Resend OTP email warning:', emailResult.error);
    }

    res.json({ success: true, message: 'A new code has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP code', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// Feature Routes (mounted as sub-routers)
// ────────────────────────────────────────────────────────────────────────

// Chat Routes: POST /, GET /history, GET /:id, DELETE /:id, PATCH /:id
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Document Routes (RAG upload / retrieval): POST /upload, GET /, DELETE /:id
const documentRoutes = require('./routes/documentRoutes');
app.use('/api/documents', documentRoutes);

// ────────────────────────────────────────────────────────────────────────
// Static Frontend Serving (Production / Single-Server Deployment)
// ────────────────────────────────────────────────────────────────────────
// When deployed as a single process, the built React app is served from /frontend/dist.
// The catch-all route delegates all non-API paths to index.html for client-side routing.
const path = require('path');
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // Fallback all other routes to index.html for client-side routing
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Default API landing route if frontend is not present (separate deployments)
  app.get('/', (req, res) => {
    res.json({ message: 'AskCare API is running successfully.' });
  });
}

// ────────────────────────────────────────────────────────────────────────
// Periodic Cleanup Job — every 5 minutes
// ────────────────────────────────────────────────────────────────────────
// Removes unverified user accounts whose OTP registration window has expired.
// Prevents the users collection from filling with zombie registrations.
setInterval(async () => {
  try {
    const deletedCount = await dbHelper.cleanupExpiredUsers();
    if (deletedCount > 0) {
      console.log(`🧹 Periodic cleanup: Removed ${deletedCount} expired unverified user(s).`);
    }
  } catch (err) {
    console.error('🧹 Periodic cleanup error:', err.message);
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// ────────────────────────────────────────────────────────────────────────
// Start Server (only in non-Vercel / local environments)
// ────────────────────────────────────────────────────────────────────────
// On Vercel, the platform handles the HTTP lifecycle; calling app.listen()
// is unnecessary and would cause issues — so we skip it.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 AskCare Server is running on port ${PORT}`);
  });
}

// Export the Express app for use as a Vercel serverless function handler
module.exports = app;
