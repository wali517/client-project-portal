import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../../');

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cpm_portal',
  jwtSecret: process.env.JWT_SECRET || 'dev_only_insecure_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  passwordResetExpiresMin: toInt(process.env.PASSWORD_RESET_EXPIRES_MIN, 30),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  uploadDir: path.isAbsolute(process.env.UPLOAD_DIR || '')
    ? process.env.UPLOAD_DIR
    : path.join(backendRoot, process.env.UPLOAD_DIR || 'src/uploads'),
  maxFileSizeMb: toInt(process.env.MAX_FILE_SIZE_MB, 15),
  rateLimitWindowMin: toInt(process.env.RATE_LIMIT_WINDOW_MIN, 15),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 300),
  authRateLimitMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 10),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'CPM Portal <no-reply@example.com>',
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@portal.test',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
};

if (env.isProduction && env.jwtSecret === 'dev_only_insecure_secret_change_me') {
  throw new Error('JWT_SECRET must be set in production');
}

export default env;
