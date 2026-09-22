/**
 * User.js — Mongoose User Model
 *
 * Defines the schema for user accounts stored in MongoDB Atlas.
 *
 * Fields:
 *   name        — Display name of the user (required, whitespace trimmed)
 *   email       — Unique login identifier, stored in lowercase (required, unique)
 *   password    — bcrypt-hashed password string (required)
 *   isVerified  — Whether the user has verified their email via OTP (default: false)
 *   otp         — Current pending OTP code (null when not active)
 *   otpExpires  — Expiry timestamp for the OTP (null when not active)
 *   createdAt   — Auto-populated by Mongoose timestamps option
 *   updatedAt   — Auto-populated by Mongoose timestamps option
 *
 * Notes:
 *   - Users created via Google OAuth are marked isVerified: true immediately.
 *   - Unverified users are periodically deleted by the cleanup job in server.js.
 *   - The otp/otpExpires fields are cleared after successful OTP verification.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true         // Remove leading/trailing whitespace automatically
  },
  email: {
    type: String,
    required: true,
    unique: true,      // Enforce at the database index level
    lowercase: true,   // Normalize to lowercase before saving
    trim: true
  },
  password: {
    type: String,
    required: true     // Stored as a bcrypt hash, never plain text
  },
  isVerified: {
    type: Boolean,
    default: false     // Must pass OTP verification before logging in
  },
  otp: {
    type: String,
    default: null      // Null when no active OTP challenge
  },
  otpExpires: {
    type: Date,
    default: null      // Null when no active OTP challenge; used for expiry check
  }
}, {
  timestamps: true   // Auto-manage createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);
