const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const db = require('./db'); // local JSON database fallback
const User = require('./models/User'); // Mongoose Model
const { generateOTP, sendOTPEmail } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const MONGODB_URI = process.env.MONGODB_URI || '';

// Middleware
app.use(cors());
app.use(express.json());

// Determine database mode
const isMongoPlaceholder = !MONGODB_URI || MONGODB_URI.includes('cluster0.xxxxx.mongodb.net');
const useMongo = !isMongoPlaceholder;

if (useMongo) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas successfully.'))
    .catch(err => {
      console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
      console.warn('⚠️ Please verify your Atlas connection URI in .env.');
    });
} else {
  console.log('\n=============================================');
  console.log('⚠️ DATABASE NOTICE: MONGODB_URI is empty or placeholder.');
  console.log('💡 STATUS: Operating in Local Fallback DB Mode (db.json)');
  console.log('💡 TIP: Add MongoDB Atlas connection string in .env to switch to Atlas.');
  console.log('=============================================\n');
}

// Unified Database Helpers
const dbHelper = {
  findUserByEmail: async (email) => {
    if (useMongo) {
      return await User.findOne({ email: email.toLowerCase() });
    } else {
      return db.findUserByEmail(email);
    }
  },

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

  updateUser: async (email, updates) => {
    if (useMongo) {
      return await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        updates,
        { new: true }
      );
    } else {
      return db.updateUser(email, updates);
    }
  }
};

// Routes

// 1. Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
  }

  try {
    const existingUser = await dbHelper.findUserByEmail(email);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      await dbHelper.updateUser(email, {
        name,
        password: hashedPassword,
        otp,
        otpExpires
      });

      await sendOTPEmail(email, otp, 'Registration Verification');
      return res.json({ success: true, message: 'Verification OTP sent to email', email });
    }

    // Hash Password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create user
    await dbHelper.createUser({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpires
    });

    await sendOTPEmail(email, otp, 'Registration Verification');

    res.json({ success: true, message: 'Registration initiated. Verification OTP sent to email', email });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// 2. Verify Registration OTP
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

    // Validate OTP
    if (user.otp !== otp || Date.now() > new Date(user.otpExpires).getTime()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Mark as verified
    await dbHelper.updateUser(email, {
      isVerified: true,
      otp: null,
      otpExpires: null
    });

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
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
});

// 3. Password Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const user = await dbHelper.findUserByEmail(email);
    if (!user) {
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
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// 4. Request Passwordless OTP Login
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

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await dbHelper.updateUser(email, {
      otp,
      otpExpires
    });

    await sendOTPEmail(email, otp, 'Login Authentication');

    res.json({ success: true, message: 'Login OTP sent to email', email });
  } catch (error) {
    console.error('Login OTP request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP code' });
  }
});

// 5. Verify Passwordless OTP Login
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

    // Validate OTP
    if (user.otp !== otp || Date.now() > new Date(user.otpExpires).getTime()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

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
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
});

// 6. Resend OTP
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

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await dbHelper.updateUser(email, {
      otp,
      otpExpires
    });

    const emailPurpose = purpose === 'login' ? 'Login Authentication' : 'Registration Verification';
    await sendOTPEmail(email, otp, emailPurpose);

    res.json({ success: true, message: 'A new code has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP code' });
  }
});

// Chat Routes
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Document Routes (RAG)
const documentRoutes = require('./routes/documentRoutes');
app.use('/api/documents', documentRoutes);

// Serve frontend static assets in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback all other routes to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AskCare Server is running on port ${PORT}`);
});
