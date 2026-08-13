const nodemailer = require('nodemailer');
require('dotenv').config();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
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

async function sendOTPEmail(email, otp, purpose = 'Verification') {
  // Check if SMTP is configured AND the password has been changed from the default placeholder
  const hasSmtp = process.env.SMTP_HOST && 
                  process.env.SMTP_USER && 
                  process.env.SMTP_PASS && 
                  process.env.SMTP_PASS !== 'your_gmail_app_password';

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

      const mailOptions = {
        from: `"AskCare AI Assist" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: `[AskCare] Your One-Time Passcode (${purpose})`,
        text: `Your passcode is: ${otp}. It will expire in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #0B0E14; color: #fff;">
            <h2 style="color: #D4FF00; text-align: center;">AskCare AI Assist</h2>
            <p style="text-align: center; color: #aaa;">You requested a passcode for <strong>${purpose}</strong>.</p>
            <div style="background: #181B22; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #2C2E38;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #D4FF00;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 11px; text-align: center;">This passcode is valid for 5 minutes. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 OTP email successfully sent to ${email}`);
      return { success: true, sent: true };
    } catch (error) {
      console.error('❌ Failed to send SMTP email:', error);
      console.log('⚠️ Falling back to Console-only OTP logging.');
      return { success: true, sent: false, error: error.message };
    }
  }

  return { success: true, sent: false };
}

module.exports = {
  generateOTP,
  sendOTPEmail
};
