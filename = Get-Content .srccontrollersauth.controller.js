warning: in the working copy of 'portal/backend/src/controllers/auth.controller.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/portal/backend/src/controllers/auth.controller.js b/portal/backend/src/controllers/auth.controller.js[m
[1mindex 6d35282..4635424 100644[m
[1m--- a/portal/backend/src/controllers/auth.controller.js[m
[1m+++ b/portal/backend/src/controllers/auth.controller.js[m
[36m@@ -1,153 +1,189 @@[m
 import crypto from "node:crypto";[m
 import User from "../models/User.js";[m
 import env from "../config/env.js";[m
 import ApiError from "../utils/ApiError.js";[m
 import asyncHandler from "../utils/asyncHandler.js";[m
 import { sendSuccess } from "../utils/apiResponse.js";[m
 import { signAccessToken } from "../services/token.service.js";[m
 import { sendPasswordResetEmail } from "../services/email.service.js";[m
 import { logActivity } from "../services/activity.service.js";[m
 import { ACTIVITY_ACTIONS } from "../constants/activityActions.js";[m
 import logger from "../utils/logger.js";[m
 [m
 export const login = asyncHandler(async (req, res) => {[m
   const { email, password } = req.body;[m
 [m
   const user = await User.findOne({ email }).select("+password");[m
   if (!user || !(await user.comparePassword(password))) {[m
     throw ApiError.unauthorized("Email or password is incorrect");[m
   }[m
   if (!user.isActive)[m
     throw ApiError.forbidden([m
       "This account is deactivated. Contact your administrator.",[m
     );[m
 [m
   user.lastLogin = new Date();[m
   await user.save({ validateBeforeSave: false });[m
 [m
   await logActivity({[m
     user,[m
     role: user.role,[m
     action: ACTIVITY_ACTIONS.USER_LOGGED_IN,[m
   });[m
 [m
   const token = signAccessToken(user);[m
   return sendSuccess(res, {[m
     message: "Signed in",[m
     data: { token, user: user.toJSON() },[m
   });[m
 });[m
 [m
 export const logout = asyncHandler(async (_req, res) =>[m
   sendSuccess(res, { message: "Signed out", data: null }),[m
 );[m
 [m
 export const me = asyncHandler(async (req, res) =>[m
   sendSuccess(res, {[m
     message: "Current user",[m
     data: { user: req.user.toJSON() },[m
   }),[m
 );[m
 [m
 export const forgotPassword = asyncHandler(async (req, res) => {[m
   const email = req.body.email?.toLowerCase()?.trim();[m
[32m+[m
[32m+[m[32m  logger.info(`[Password Reset] Request received for ${email}`);[m
[32m+[m
   const user = await User.findOne({ email });[m
 [m
   const genericResponse = (extraData = {}) =>[m
     sendSuccess(res, {[m
       message: "If that email is registered, a reset link is on its way.",[m
       data: extraData,[m
     });[m
 [m
[31m-  if (!user || !user.isActive) return genericResponse();[m
[32m+[m[32m  if (!user) {[m
[32m+[m[32m    logger.warn(`[Password Reset] No user found for ${email}`);[m
[32m+[m[32m    return genericResponse();[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  logger.info([m
[32m+[m[32m    `[Password Reset] User found: role=${user.role}, isActive=${user.isActive}`,[m
[32m+[m[32m  );[m
[32m+[m
[32m+[m[32m  if (!user.isActive) {[m
[32m+[m[32m    logger.warn([m
[32m+[m[32m      `[Password Reset] Account is deactivated: role=${user.role}`,[m
[32m+[m[32m    );[m
[32m+[m[32m    return genericResponse();[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  const rawToken = user.createPasswordResetToken([m
[32m+[m[32m    env.passwordResetExpiresMin,[m
[32m+[m[32m  );[m
 [m
[31m-  const rawToken = user.createPasswordResetToken(env.passwordResetExpiresMin);[m
   await user.save({ validateBeforeSave: false });[m
 [m
[31m-  const baseUrl = String(env.clientUrl).trim().replace(/\/+$/, "").replace(/\/api$/i, "");[m
[32m+[m[32m  logger.info([m
[32m+[m[32m    `[Password Reset] Reset token created for active ${user.role} account`,[m
[32m+[m[32m  );[m
[32m+[m
[32m+[m[32m  const baseUrl = String(env.clientUrl)[m
[32m+[m[32m    .trim()[m
[32m+[m[32m    .replace(/\/+$/, "")[m
[32m+[m[32m    .replace(/\/api$/i, "");[m
[32m+[m
   const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;[m
 [m
[32m+[m[32m  logger.info(`[Password Reset] Sending reset email to ${user.email}`);[m
[32m+[m
   const mailResult = await sendPasswordResetEmail({[m
     to: user.email,[m
     name: user.name,[m
     resetUrl,[m
   });[m
 [m
   if (!mailResult?.delivered) {[m
     logger.error([m
[31m-      `Password reset email for ${user.email} was NOT delivered: ${mailResult?.reason || 'unknown reason'}`,[m
[32m+[m[32m      `[Password Reset] Email NOT delivered to ${user.email}: ${[m
[32m+[m[32m        mailResult?.reason || "unknown reason"[m
[32m+[m[32m      }`,[m
     );[m
 [m
     if (!env.isProduction) {[m
       return genericResponse({[m
         emailDelivered: false,[m
[31m-        emailError: mailResult?.reason || 'Email could not be sent',[m
[32m+[m[32m        emailError: mailResult?.reason || "Email could not be sent",[m
       });[m
     }[m
[32m+[m[32m  } else {[m
[32m+[m[32m    logger.info([m
[32m+[m[32m      `[Password Reset] Email successfully delivered to ${user.email}`,[m
[32m+[m[32m    );[m
   }[m
 [m
   return genericResponse();[m
 });[m
 [m
 export const resetPassword = asyncHandler(async (req, res) => {[m
   const hashed = crypto[m
     .createHash("sha256")[m
     .update(req.body.token)[m
     .digest("hex");[m
   const user = await User.findOne({[m
     passwordResetToken: hashed,[m
     passwordResetExpires: { $gt: new Date() },[m
   }).select("+passwordResetToken +passwordResetExpires");[m
 [m
   if (!user)[m
     throw ApiError.badRequest("This reset link is invalid or has expired");[m
 [m
   user.password = req.body.password;[m
   user.passwordResetToken = undefined;[m
   user.passwordResetExpires = undefined;[m
   await user.save();[m
 [m
   await logActivity({[m
     user,[m
     role: user.role,[m
     action: ACTIVITY_ACTIONS.PASSWORD_RESET,[m
   });[m
 [m
   return sendSuccess(res, {[m
     message: "Password updated. You can sign in now.",[m
     data: null,[m
   });[m
 });[m
 [m
 export const changePassword = asyncHandler(async (req, res) => {[m
   const user = await User.findById(req.user._id).select("+password");[m
   if (!(await user.comparePassword(req.body.currentPassword))) {[m
     throw ApiError.badRequest("Current password is incorrect");[m
   }[m
   user.password = req.body.newPassword;[m
   await user.save();[m
 [m
   await logActivity({[m
     user: req.user,[m
     role: req.user.role,[m
     action: ACTIVITY_ACTIONS.PASSWORD_CHANGED,[m
   });[m
 [m
   return sendSuccess(res, { message: "Password updated", data: null });[m
 });[m
 [m
 export const updateProfile = asyncHandler(async (req, res) => {[m
   Object.assign(req.user, req.body);[m
   await req.user.save();[m
 [m
   await logActivity({[m
     user: req.user,[m
     role: req.user.role,[m
     action: ACTIVITY_ACTIONS.PROFILE_UPDATED,[m
   });[m
 [m
   return sendSuccess(res, {[m
     message: "Profile updated",[m
     data: { user: req.user.toJSON() },[m
   });[m
 });[m
