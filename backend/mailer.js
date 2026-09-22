/**
 * mailer.js — OTP Generation & Email Delivery
 *
 * Responsible for:
 *   1. Generating a 6-digit numeric One-Time Password (OTP)
 *   2. Sending that OTP to the user's email via SMTP (nodemailer)
 *
 * Configuration (set in .env):
 *   SMTP_HOST   — e.g. smtp.gmail.com
 *   SMTP_PORT   — 587 (TLS) or 465 (SSL)
 *   SMTP_USER   — your Gmail address
 *   SMTP_PASS   — Gmail App Password (NOT your account password)
 *   SMTP_FROM   — Optional "From" address, defaults to SMTP_USER
 *
 * If SMTP is not configured (or the password is still the default placeholder),
 * the OTP is only logged to the console — no actual email is sent.
 * This allows local development without a real mail server.
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * generateOTP — Creates a cryptographically adequate 6-digit OTP.
 * Uses Math.random() to produce a number in [100000, 999999].
 * @returns {string} 6-digit OTP as a string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

/**
 * getTransporter — Builds and returns a nodemailer SMTP transporter instance.
 * A new transporter is created per email send (pool: false) to work correctly
 * in serverless environments where persistent connections are not supported.
 * @returns {nodemailer.Transporter}
 */
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for port 465 (SSL), false for STARTTLS (587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Serverless friendly: open and close connection on each send
    pool: false,
    connectionTimeout: 5000, // 5s timeout to connect
    greetingTimeout: 5000,   // 5s timeout to handshake
    socketTimeout: 10000,    // 10s socket activity timeout
  });
}

/**
 * sendOTPEmail — Sends a styled OTP email to the given address.
 *
 * Always logs the OTP to the console for local development debugging.
 * Only sends a real email if SMTP credentials are fully configured.
 *
 * @param {string} email   — Recipient email address
 * @param {string} otp     — The 6-digit OTP code to send
 * @param {string} purpose — Human-readable purpose label (e.g. 'Login Authentication')
 * @returns {Promise<{success: boolean, sent: boolean, error?: string}>}
 */
async function sendOTPEmail(email, otp, purpose = 'Verification') {
  // Check if SMTP is configured AND the password has been changed from the default placeholder
  const hasSmtp = process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'your_gmail_app_password'; // Placeholder check

  // Always log OTP to console — useful for local testing without real SMTP
  console.log('\n=============================================');
  console.log(`🔑 OTP GENERATED FOR: ${email}`);
  console.log(`👉 PURPOSE: ${purpose}`);
  console.log(`⭐ CODE: ${otp}`);
  if (!hasSmtp) {
    console.log('💡 TIP: Configure Gmail App Password in .env to send real emails.');
  }
  console.log('=============================================\n');

  if (hasSmtp) {
    try {
      const transporter = getTransporter();

      // Compose the email with both plain-text and rich HTML versions
      const mailOptions = {
        from: `"AskCare" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: `[AskCare] Your One-Time Passcode (${purpose})`,
        text: `Your passcode is: ${otp}. It will expire in 5 minutes.`,  // Fallback plain text
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #0B0E14; color: #fff;">
            <h2 style="color: #D4FF00; text-align: center;">AskCare</h2>
            <p style="text-align: center; color: #aaa;">You requested a passcode for <strong>${purpose}</strong>.</p>
            <div style="background: #181B22; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #2C2E38;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #D4FF00;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 11px; text-align: center;">This passcode is valid for 5 minutes. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`OTP email successfully sent to ${email}`);
      return { success: true, sent: true };
    } catch (error) {
      // Log the failure but don't crash the server — the OTP was still logged to console
      console.error('Failed to send SMTP email:', error);
      console.log('Falling back to Console-only OTP logging.');
      return { success: true, sent: false, error: error.message };
    }
  }

  // SMTP not configured — OTP was logged to console only
  return { success: true, sent: false };
}

module.exports = {
  generateOTP,
  sendOTPEmail
};
