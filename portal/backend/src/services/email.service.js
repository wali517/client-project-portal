import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;
  if (env.smtp.service || env.smtp.host) {
    const transportConfig = env.smtp.service
      ? { service: env.smtp.service, auth: { user: env.smtp.user, pass: env.smtp.password } }
      : {
          host: env.smtp.host,
          port: env.smtp.port,
          secure: env.smtp.port === 465,
          auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
          tls: { rejectUnauthorized: false },
        };
    transporter = nodemailer.createTransport(transportConfig);
    return transporter;
  }
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
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
  const fromAddress = env.smtp.from || 'CPM Portal <no-reply@portal.test>';

  if (!mailer) {
    logger.info(`[Email Service - Console Fallback]\nTo: ${to}\nSubject: ${subject}\nBody:\n${text}`);
    return { delivered: false, reason: 'No mail transporter available' };
  }
  try {
    const info = await mailer.sendMail({ from: fromAddress, to, subject, text, html });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[Ethereal Mailbox Delivered] To: ${to} | Preview URL: ${previewUrl}`);
    } else {
      logger.info(`Email sent via SMTP to ${to}: ${info.messageId || 'OK'}`);
    }
    return { delivered: true, info, previewUrl };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    logger.info(`[Email Service - Console Fallback on Error]\nTo: ${to}\nSubject: ${subject}\nBody:\n${text}`);
    return { delivered: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) =>
  sendMail({
    to,
    subject: 'Reset your portal password',
    text: `Hi ${name},\n\nUse this link to set a new password (valid for ${env.passwordResetExpiresMin} minutes):\n${resetUrl}\n\nIf you did not ask for this, you can ignore this email.`,
    html: `<p>Hi ${name},</p><p>Use this link to set a new password (valid for ${env.passwordResetExpiresMin} minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
  });
