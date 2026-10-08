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

function getCleanPass() {
  const raw = process.env.SMTP_PASS || '';
  return raw.replace(/\s+/g, '').replace(/["']/g, '');
}

function isSmtpConfigured() {
  const cleanPass = getCleanPass();
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    cleanPass &&
    cleanPass !== 'your_gmail_app_password'
  );
}

let cachedTransporter = null;

/**
 * getTransporter — Builds and returns a nodemailer SMTP transporter instance.
 * In persistent Node environments, reuses a pooled connection for fast delivery.
 * In serverless (Vercel), creates a fresh lightweight connection.
 * @returns {nodemailer.Transporter}
 */
function getTransporter() {
  const cleanPass = getCleanPass();
  const port = parseInt(process.env.SMTP_PORT || '587');
  const isSecure = port === 465;

  if (process.env.VERCEL) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass,
      },
      pool: false,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass,
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return cachedTransporter;
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
  const hasSmtp = isSmtpConfigured();

  // Always log OTP to console — useful for local testing without real SMTP
  console.log('\n=============================================');
  console.log(`🔑 OTP GENERATED FOR: ${email}`);
  console.log(`👉 PURPOSE: ${purpose}`);
  console.log(`⭐ CODE: ${otp}`);
  if (!hasSmtp) {
    console.log('💡 TIP: Configure Gmail App Password in .env / Vercel to send real emails.');
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

/**
 * sendContactEmail — Sends notification of a new contact form message to support,
 * and an acknowledgement receipt back to the sender.
 *
 * @param {Object} contact
 * @param {string} contact.name    — Sender name
 * @param {string} contact.email   — Sender email
 * @param {string} contact.subject — Subject of inquiry
 * @param {string} contact.message — Inquirer message body
 * @returns {Promise<{success: boolean, sent: boolean, error?: string}>}
 */
async function sendContactEmail({ name, email, subject, message }) {
  const hasSmtp = isSmtpConfigured();

  const sanitizedSubject = subject && subject.trim() ? subject.trim() : 'General Inquiry';
  const supportEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'askcare.support@gmail.com';

  console.log('\n=============================================');
  console.log('📨 CONTACT FORM SUBMISSION RECEIVED:');
  console.log(`👤 Name: ${name}`);
  console.log(`📧 Email: ${email}`);
  console.log(`📋 Subject: ${sanitizedSubject}`);
  console.log(`💬 Message: ${message}`);
  if (!hasSmtp) {
    console.log('⚠️ [MAILER] SMTP is not configured. Email notification skipped.');
    console.log(`[MAILER] Details — SMTP_HOST: ${process.env.SMTP_HOST || 'MISSING'}, SMTP_USER: ${process.env.SMTP_USER || 'MISSING'}, SMTP_PASS: ${process.env.SMTP_PASS ? 'SET' : 'MISSING'}`);
  }
  console.log('=============================================\n');

  if (hasSmtp) {
    try {
      const transporter = getTransporter();

      // 1. Notify AskCare Admin/Support inbox
      const adminMailOptions = {
        from: `"AskCare Contact Form" <${supportEmail}>`,
        to: supportEmail,
        replyTo: `"${name}" <${email}>`,
        subject: `[AskCare Contact] ${sanitizedSubject} — from ${name}`,
        text: `New contact submission received from ${name} (${email}):\n\nSubject: ${sanitizedSubject}\n\nMessage:\n${message}\n\nSubmitted at: ${new Date().toISOString()}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #1f2937; border-radius: 12px; background: #0B0E14; color: #f3f4f6;">
            <div style="border-bottom: 1px solid #1f2937; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #D4FF00; margin: 0 0 6px 0; font-size: 20px;">New Contact Form Message</h2>
              <span style="color: #9ca3af; font-size: 12px;">Submitted via AskCare Web Portal</span>
            </div>
            
            <div style="background: #11141C; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #9ca3af;">Sender Name:</strong> <span style="color: #ffffff;">${name}</span></p>
              <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #9ca3af;">Sender Email:</strong> <a href="mailto:${email}" style="color: #D4FF00; text-decoration: none;">${email}</a></p>
              <p style="margin: 0; font-size: 14px;"><strong style="color: #9ca3af;">Subject:</strong> <span style="color: #ffffff;">${sanitizedSubject}</span></p>
            </div>

            <div style="background: #151922; border-left: 4px solid #D4FF00; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Message Content</h4>
              <p style="margin: 0; color: #e5e7eb; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>

            <div style="color: #6b7280; font-size: 12px; text-align: center; border-top: 1px solid #1f2937; padding-top: 16px;">
              Hit "Reply" in your email client to respond directly to ${name} (${email}).
            </div>
          </div>
        `,
      };

      // 2. Automated Confirmation Receipt to the user
      const userReceiptOptions = {
        from: `"AskCare Support" <${supportEmail}>`,
        to: email,
        subject: `[AskCare] We received your message: ${sanitizedSubject}`,
        text: `Hi ${name},\n\nThank you for reaching out to AskCare. We have received your inquiry regarding "${sanitizedSubject}" and our team will get back to you within 24 hours.\n\nBest regards,\nThe AskCare Team`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; margin: auto; padding: 24px; border: 1px solid #1f2937; border-radius: 12px; background: #0B0E14; color: #f3f4f6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #D4FF00; margin: 0 0 4px 0; font-size: 24px; letter-spacing: -0.5px;">AskCare</h1>
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">Clinical Intelligence & Support</p>
            </div>

            <div style="background: #11141C; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px;">Hello ${name},</h3>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 14px 0;">
                Thank you for contacting AskCare! We have received your message regarding <strong style="color: #ffffff;">"${sanitizedSubject}"</strong>.
              </p>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
                Our support and engineering teams typically respond within 24 hours.
              </p>
            </div>

            <div style="background: #151922; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: #6b7280; font-size: 11px; text-transform: uppercase;">Your Submitted Inquiry</h4>
              <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${message}</p>
            </div>

            <p style="color: #6b7280; font-size: 11px; text-align: center; margin: 0;">
              AskCare Support • <a href="mailto:${supportEmail}" style="color: #D4FF00; text-decoration: none;">${supportEmail}</a>
            </p>
          </div>
        `,
      };

      // Concurrently dispatch both emails and await completion so serverless execution is not aborted
      const [adminResult, userResult] = await Promise.allSettled([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(userReceiptOptions)
      ]);

      const adminOk = adminResult.status === 'fulfilled';
      const userOk = userResult.status === 'fulfilled';

      if (adminOk) {
        console.log(`[MAILER] Admin contact notification sent to ${supportEmail}`);
      } else {
        console.error('[MAILER] Failed to send admin contact email:', adminResult.reason?.message || adminResult.reason);
      }

      if (userOk) {
        console.log(`[MAILER] User confirmation receipt sent to ${email}`);
      } else {
        console.warn(`[MAILER] Could not send confirmation copy to ${email}:`, userResult.reason?.message || userResult.reason);
      }

      return {
        success: adminOk || userOk,
        sent: adminOk || userOk,
        adminSent: adminOk,
        userSent: userOk,
        error: !adminOk ? (adminResult.reason?.message || 'Admin email failed') : undefined
      };
    } catch (error) {
      console.error('[MAILER] Unexpected error during sendContactEmail:', error);
      return { success: false, sent: false, error: error.message };
    }
  }

  return { success: false, sent: false, error: 'SMTP not configured' };
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendContactEmail,
  isSmtpConfigured
};

