import nodemailer from "nodemailer";
import env, { envFilePath, envFileFound } from "../config/env.js";
import logger from "../utils/logger.js";
let transporter = null;
const hasSmtp = () => Boolean(env.smtp.service || env.smtp.host);
const clean = (value = "") =>
  String(value)
    .trim()
    .replace(/^["']|["']$/g, "");
const cleanPassword = (value = "") => clean(value).replace(/\s+/g, "");
export const explainMailError = (error) => {
  const code = error?.code || "";
  const text = String(error?.message || error || "");
  if (
    code === "EAUTH" ||
    /535|Invalid login|Username and Password not accepted|BadCredentials/i.test(
      text,
    )
  ) {
    return "SMTP login was rejected. For Gmail, SMTP_USER must be the full address and SMTP_PASSWORD must be a 16-character App Password (not your normal Gmail password). 2-Step Verification must be ON to create one.";
  }
  if (
    [
      "ESOCKET",
      "ECONNECTION",
      "ETIMEDOUT",
      "ECONNREFUSED",
      "ENOTFOUND",
      "EDNS",
    ].includes(code)
  ) {
    return `Could not reach the mail server (${code}). Check SMTP_SERVICE / SMTP_HOST / SMTP_PORT and that your network or firewall allows outgoing mail.`;
  }
  if (/self.signed|certificate/i.test(text)) {
    return "The mail server certificate was rejected (TLS error).";
  }
  return text || "Unknown mail error";
};
const PLACEHOLDER =
  /youraddress|your-address|example\.com|<.*>|app[ -]?password|your-16|xxxx/i;
const hasPlaceholders = () =>
  PLACEHOLDER.test(String(env.smtp.user)) ||
  PLACEHOLDER.test(String(env.smtp.password));

const notConfiguredReason = () =>
  envFileFound
    ? `SMTP settings are missing. Found ${envFilePath} but it has no active SMTP_SERVICE/SMTP_HOST, SMTP_USER and SMTP_PASSWORD lines (lines starting with # are ignored, and the file must be saved as ".env", not ".env.txt").`
    : `No .env file exists at ${envFilePath}. Create it there (copy .env.example) and add the SMTP settings.`;

const smtpSummary = () =>
  env.smtp.service
    ? `service=${env.smtp.service} user=${clean(env.smtp.user)}`
    : `host=${clean(env.smtp.host)} port=${env.smtp.port} user=${clean(env.smtp.user) || "(none)"}`;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!hasSmtp()) return null;
  const timeouts = {
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };
  const auth = env.smtp.user
    ? { user: clean(env.smtp.user), pass: cleanPassword(env.smtp.password) }
    : undefined;
  const transportConfig = env.smtp.service
    ? { service: clean(env.smtp.service), auth, ...timeouts }
    : {
        host: clean(env.smtp.host),
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth,
        ...timeouts,
      };
  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
};
export const verifyEmailConfig = async () => {
  if (!hasSmtp()) {
    const reason = notConfiguredReason();
    logger.error(
      `EMAIL NOT CONFIGURED - no emails (including password reset) can be delivered. ${reason}`,
    );

    return {
      ok: false,
      reason,
    };
  }
  if (hasPlaceholders()) {
    const reason =
      "SMTP_USER / SMTP_PASSWORD still contain the example placeholder text. Replace them with your real Gmail address and 16-character App Password.";
    logger.error(`[Email] ${reason}`);
    return {
      ok: false,
      reason,
    };
  }

  try {
    await getTransporter().verify();
    logger.info(
      `[Email] SMTP login OK (${smtpSummary()}). Emails will be delivered.`,
    );
    return {
      ok: true,
    };
  } catch (error) {
    const reason = explainMailError(error);
    logger.error(`[Email] SMTP check FAILED (${smtpSummary()}): ${reason}`);
    return {
      ok: false,
      reason,
    };
  }
};
export const sendMail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();
  if (!mailer) {
    const reason = notConfiguredReason();
    logger.error(`[Email] NOT sent: ${reason}`);
    return {
      delivered: false,
      reason,
    };
  }
  if (hasPlaceholders()) {
    const reason = "SMTP_USER / SMTP_PASSWORD still contain placeholder text.";
    logger.error(`[Email] NOT sent: ${reason}`);
    return {
      delivered: false,
      reason,
    };
  }
  const recipient = clean(to);
  const sender = clean(env.smtp.from) || clean(env.smtp.user);
  if (!recipient) {
    const reason = "Recipient email address is empty.";
    logger.error(`[Email] NOT sent: ${reason}`);
    return {
      delivered: false,
      reason,
    };
  }
  if (!sender) {
    const reason = "Sender email address is empty.";
    logger.error(`[Email] NOT sent: ${reason}`);
    return {
      delivered: false,
      reason,
    };
  }
  try {
    const info = await mailer.sendMail({
      from: `"Client Project Portal" <${sender}>`,
      to: recipient,
      subject: "CPM Reset Password",
      text,
      html,
    });
    const accepted = info.accepted || [];
    if (!accepted.includes(recipient)) {
      const reason = `Mail server did not accept recipient: ${recipient}`;
      logger.error(`[Email] NOT delivered: ${reason}`);
      return {
        delivered: false,
        reason,
      };
    }
    logger.info(
      `[Email] Accepted by SMTP for recipient ${recipient}. MessageId=${
        info.messageId || "OK"
      }`,
    );
    return {
      delivered: true,
      info,
    };
  } catch (error) {
    transporter = null;
    const reason = explainMailError(error);
    logger.error(`[Email] FAILED for recipient ${recipient}: ${reason}`);
    return {
      delivered: false,
      reason,
      error: error.message,
    };
  }
};

const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) =>
  sendMail({
    to,
    subject: "CPM Reset Password",
    text: `Hi ${name},
We received a request to reset your Client Project Portal password.
Use the link below to choose a new password:
${resetUrl}
This password reset link is valid for ${env.passwordResetExpiresMin} minutes.
If you did not request a password reset, you can safely ignore this email.
Client Project Portal`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2937">
        <h2 style="margin-bottom:20px;">
          Client Project Portal
        </h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>We received a request to reset your Client Project Portal password.</p>
        <p>Click the button below to choose a new password.
          This link is valid for ${env.passwordResetExpiresMin} minutes.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#4f46e5; color:#ffffff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block;">
            Reset Password </a> </p>
        <p style="font-size:12px;color:#6b7280;">
          Or paste this link into your browser: </p>
        <p style="font-size:12px;color:#6b7280;word-break:break-all;">
          ${resetUrl} </p>
        <p style="font-size:12px;color:#6b7280;">
          If you did not request a password reset, you can safely ignore this email.</p>
        <p style="margin-top:24px;">
          <strong>Client Project Portal</strong> </p>
      </div>
    `,
  });
