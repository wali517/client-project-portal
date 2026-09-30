import crypto from "node:crypto";
import User from "../models/User.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { signAccessToken } from "../services/token.service.js";
import { sendPasswordResetEmail } from "../services/email.service.js";
import { logActivity } from "../services/activity.service.js";
import { ACTIVITY_ACTIONS } from "../constants/activityActions.js";
import logger from "../utils/logger.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Email or password is incorrect");
  }
  if (!user.isActive)
    throw ApiError.forbidden(
      "This account is deactivated. Contact your administrator.",
    );

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await logActivity({
    user,
    role: user.role,
    action: ACTIVITY_ACTIONS.USER_LOGGED_IN,
  });

  const token = signAccessToken(user);
  return sendSuccess(res, {
    message: "Signed in",
    data: { token, user: user.toJSON() },
  });
});

export const logout = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: "Signed out", data: null }),
);

export const me = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: "Current user",
    data: { user: req.user.toJSON() },
  }),
);

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase()?.trim();

  logger.info(`[Password Reset] Request received for ${email}`);

  const user = await User.findOne({ email });

  const genericResponse = (extraData = {}) =>
    sendSuccess(res, {
      message: "If that email is registered, a reset link is on its way.",
      data: extraData,
    });

  if (!user) {
    logger.warn(`[Password Reset] No user found for ${email}`);
    return genericResponse();
  }

  logger.info(
    `[Password Reset] User found: role=${user.role}, isActive=${user.isActive}`,
  );

  if (!user.isActive) {
    logger.warn(
      `[Password Reset] Account is deactivated: role=${user.role}`,
    );
    return genericResponse();
  }

  const rawToken = user.createPasswordResetToken(
    env.passwordResetExpiresMin,
  );

  await user.save({ validateBeforeSave: false });

  logger.info(
    `[Password Reset] Reset token created for active ${user.role} account`,
  );

  const baseUrl = String(env.clientUrl)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  logger.info(`[Password Reset] Sending reset email to ${user.email}`);

  const mailResult = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  if (!mailResult?.delivered) {
    logger.error(
      `[Password Reset] Email NOT delivered to ${user.email}: ${
        mailResult?.reason || "unknown reason"
      }`,
    );

    if (!env.isProduction) {
      return genericResponse({
        emailDelivered: false,
        emailError: mailResult?.reason || "Email could not be sent",
      });
    }
  } else {
    logger.info(
      `[Password Reset] Email successfully delivered to ${user.email}`,
    );
  }

  return genericResponse();
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user)
    throw ApiError.badRequest("This reset link is invalid or has expired");

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await logActivity({
    user,
    role: user.role,
    action: ACTIVITY_ACTIONS.PASSWORD_RESET,
  });

  return sendSuccess(res, {
    message: "Password updated. You can sign in now.",
    data: null,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest("Current password is incorrect");
  }
  user.password = req.body.newPassword;
  await user.save();

  await logActivity({
    user: req.user,
    role: req.user.role,
    action: ACTIVITY_ACTIONS.PASSWORD_CHANGED,
  });

  return sendSuccess(res, { message: "Password updated", data: null });
});

export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();

  await logActivity({
    user: req.user,
    role: req.user.role,
    action: ACTIVITY_ACTIONS.PROFILE_UPDATED,
  });

  return sendSuccess(res, {
    message: "Profile updated",
    data: { user: req.user.toJSON() },
  });
});
