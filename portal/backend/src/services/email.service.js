import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

const hasSmtp = () => Boolean(env.smtp.service || env.smtp.host);

const getTransporter = async () => {
  if (transporter) return transporter;

  if (hasSmtp()) {
    const timeouts = { connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 };
    const transportConfig = env.smtp.service
      ? { service: env.smtp.service, auth: { user: env.smtp.user, pass: env.smtp.password }, ...timeouts }
      : {
          host: env.smtp.host,
          port: env.smtp.port,
          secure: env.smtp.port === 465,
          auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
          ...timeouts,
        };
    transporter = nodemailer.createTransport(transportConfig);
    return transporter;
  }

  // Ethereal is a FAKE inbox (mail never reaches a real person). Local development only.
  if (env.isProduction) {
    logger.error(
      'SMTP is not configured. Set SMTP_SERVICE (e.g. gmail) or SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM so reset emails reach real inboxes.'
    );
    return null;
  }
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info(`[Email Service] Ethereal test mailer initialized for ${testAccount.user}`);
    return transporter;
  } catch (err) {
    logger.warn(`Could not create Ethereal test account: ${err.message}`);
    return null;
  }
};

export const sendMail = async ({ to, subject, text, html }) => {
  const mailer = await getTransporter();
  const fromAddress = env.smtp.from || env.smtp.user || 'CPM Portal <no-reply@portal.test>';

  if (!mailer) {
    logger.warn(`[Email Service] No mail transporter available. Email to ${to} was NOT sent.`);
    return { delivered: false, reason: 'No mail transporter available' };
  }
  try {
    const info = await mailer.sendMail({ from: fromAddress, to, subject, text, html });
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    if (previewUrl) {
      logger.info(`[Ethereal test mailbox] To: ${to} | Preview URL: ${previewUrl}`);
    } else {
      logger.info(`Email sent via SMTP to ${to}: ${info.messageId || 'OK'}`);
    }
    return { delivered: !previewUrl, previewUrl, info };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    return { delivered: false, error: error.message };
  }
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) =>
  sendMail({
    to,
    subject: 'Reset your portal password',
    text: `Hi ${name},\n\nWe received a request to reset your password. Open this link to choose a new one (valid for ${env.passwordResetExpiresMin} minutes):\n${resetUrl}\n\nIf you did not ask for this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2937">
        <p>Hi ${escapeHtml(name)},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one. The link is valid for ${env.passwordResetExpiresMin} minutes.</p>
        <p style="margin:24px 0"><a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
        <p style="font-size:12px;color:#6b7280">Or paste this link into your browser:<br>${resetUrl}</p>
        <p style="font-size:12px;color:#6b7280">If you did not ask for this, you can ignore this email.</p>
      </div>`,
  });
