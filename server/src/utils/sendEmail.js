/**
 * sendEmail — Nodemailer-based email service.
 *
 * Why: Centralizing email logic here means all transactional emails
 *      (verification, password reset, order confirmation) use the
 *      same transport, from address, and error handling.
 *
 * Transport: Gmail SMTP (easily swappable to SendGrid, Mailgun, etc.)
 *            Just change the transporter config and env vars.
 *
 * Usage:
 *   await sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Verify your email',
 *     html: '<p>Click <a href="...">here</a> to verify.</p>',
 *   });
 */
const nodemailer = require('nodemailer');

/**
 * Create the Nodemailer transporter.
 * Uses environment variables so no credentials are hardcoded.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

let etherealAccount = null;
let etherealTransporter = null;

/**
 * Send a transactional email.
 * @param {object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html    - HTML body content
 * @param {string} [options.text]  - Plain text fallback (auto-generated if omitted)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;
  let isEthereal = false;

  // Fallback to Ethereal if credentials are not set or are just the placeholder
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    isEthereal = true;
    if (!etherealTransporter) {
      if (!etherealAccount) {
        etherealAccount = await nodemailer.createTestAccount();
      }
      etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass,
        },
      });
    }
    transporter = etherealTransporter;
  } else {
    transporter = createTransporter();
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Craftora'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@craftora.com'}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // strip HTML tags for text fallback
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (isEthereal) {
    console.log('==================================================');
    console.log('📩 TEST EMAIL SENT VIA ETHEREAL');
    console.log('🔗 Preview URL: ' + nodemailer.getTestMessageUrl(info));
    console.log('==================================================');
  }
  
  return info;
};

// ─── Email Template Helpers ─────────────────────────────────────────────────

/**
 * HTML email template wrapper — applies Craftora branding.
 * @param {string} content - Inner HTML content
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Craftora</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #10b981; padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 40px; color: #374151; }
    .body h2 { margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #111827; }
    .body p { margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #6b7280; }
    .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; }
    .footer { padding: 24px 40px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 0; font-size: 13px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Craftora</h1>
      <p>Handcrafted with Love</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Craftora. All rights reserved.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
</body>
</html>
`;

/**
 * Email verification email template.
 * @param {string} name  - User's first name
 * @param {string} url   - Verification link
 */
const emailVerificationTemplate = (name, url) =>
  emailWrapper(`
    <h2>Verify your email, ${name}! 👋</h2>
    <p>Welcome to Craftora! We're thrilled to have you on board. To get started, please verify your email address by clicking the button below.</p>
    <a href="${url}" class="btn">Verify Email Address</a>
    <p>This link will expire in <strong>24 hours</strong>.</p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size:13px; word-break:break-all; color:#10b981;">${url}</p>
  `);

/**
 * Password reset email template.
 * @param {string} name - User's first name
 * @param {string} url  - Password reset link
 */
const passwordResetTemplate = (name, url) =>
  emailWrapper(`
    <h2>Reset your password, ${name}</h2>
    <p>We received a request to reset the password for your Craftora account. Click the button below to choose a new password.</p>
    <a href="${url}" class="btn">Reset Password</a>
    <p>This link will expire in <strong>10 minutes</strong>.</p>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `);

/**
 * Order confirmation email template.
 * @param {string} name     - User's first name
 * @param {string} orderId  - Short order ID
 * @param {number} total    - Order total in rupees
 */
const orderConfirmationTemplate = (name, orderId, total) =>
  emailWrapper(`
    <h2>Order Confirmed! 🎉</h2>
    <p>Hi ${name}, thank you for shopping with Craftora! Your order has been placed successfully.</p>
    <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background:#f9fafb;">
        <td style="padding:12px; font-weight:600; color:#374151;">Order ID</td>
        <td style="padding:12px; color:#6b7280;">#${orderId}</td>
      </tr>
      <tr>
        <td style="padding:12px; font-weight:600; color:#374151;">Total Amount</td>
        <td style="padding:12px; color:#10b981; font-weight:600;">&#x20B9;${total.toFixed(2)}</td>
      </tr>
    </table>
    <p>We'll notify you when your order ships. You can track your order in your account dashboard.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" class="btn">Track Order</a>
  `);

/**
 * Payment confirmation email template.
 * @param {string} name     - User's first name
 * @param {string} orderId  - Short order ID
 * @param {number} total    - Order total in rupees
 * @param {string} transactionId - Razorpay transaction ID
 */
const paymentConfirmationTemplate = (name, orderId, total, transactionId) =>
  emailWrapper(`
    <h2>Payment Successful! 🎉</h2>
    <p>Hi ${name}, your payment for order <strong>#${orderId}</strong> has been received and verified successfully.</p>
    <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background:#f9fafb;">
        <td style="padding:12px; font-weight:600; color:#374151;">Order ID</td>
        <td style="padding:12px; color:#6b7280;">#${orderId}</td>
      </tr>
      <tr>
        <td style="padding:12px; font-weight:600; color:#374151;">Amount Paid</td>
        <td style="padding:12px; color:#10b981; font-weight:600;">&#x20B9;${total.toFixed(2)}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:12px; font-weight:600; color:#374151;">Transaction ID</td>
        <td style="padding:12px; color:#6b7280; font-size:13px;">${transactionId}</td>
      </tr>
    </table>
    <p>Your order is now being processed. You can track its status in your account dashboard.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" class="btn">View Order</a>
  `);

module.exports = {
  sendEmail,
  emailVerificationTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
  paymentConfirmationTemplate,
};
