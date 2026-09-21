import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/** JWT carries only what authorisation needs: subject + role. */
export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);
