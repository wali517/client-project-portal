import crypto from 'node:crypto';
import User from '../models/User.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { signAccessToken } from '../services/token.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTIONS } from '../constants/activityActions.js';
import logger from '../utils/logger.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password - no account enumeration.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }
  if (!user.isActive) throw ApiError.forbidden('This account is deactivated. Contact your administrator.');

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await logActivity({ user, role: user.role, action: ACTIVITY_ACTIONS.USER_LOGGED_IN });

  const token = signAccessToken(user);
  return sendSuccess(res, {
    message: 'Signed in',
    data: { token, user: user.toJSON() },
  });
});

export const logout = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Signed out', data: null })
);

export const me = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Current user', data: { user: req.user.toJSON() } })
);

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase()?.trim();
  const user = await User.findOne({ email });

  // Always answer the same way so the endpoint cannot be used to find accounts.
  const genericResponse = () =>
    sendSuccess(res, {
      message: 'If that email is registered, a reset link is on its way.',
      data: null,
    });

  if (!user || !user.isActive) return genericResponse();

  const rawToken = user.createPasswordResetToken(env.passwordResetExpiresMin || 30);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  logger.info(`Password reset link generated for ${user.email} (expires in 30 min): ${resetUrl}`);

  return genericResponse();
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await logActivity({ user, role: user.role, action: ACTIVITY_ACTIONS.PASSWORD_RESET });

  return sendSuccess(res, { message: 'Password updated. You can sign in now.', data: null });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();

  await logActivity({ user: req.user, role: req.user.role, action: ACTIVITY_ACTIONS.PASSWORD_CHANGED });

  return sendSuccess(res, { message: 'Password updated', data: null });
});

export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();

  await logActivity({ user: req.user, role: req.user.role, action: ACTIVITY_ACTIONS.PROFILE_UPDATED });

  return sendSuccess(res, { message: 'Profile updated', data: { user: req.user.toJSON() } });
});
