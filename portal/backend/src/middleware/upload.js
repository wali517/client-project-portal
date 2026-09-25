import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { ALLOWED_MIME_TYPES } from "../constants/files.js";

const isVercel = Boolean(process.env.VERCEL);

const uploadDir = isVercel ? "/tmp/cpm-portal-uploads" : env.uploadDir;

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase()
      .slice(0, 12)
      .replace(/[^a-z0-9.]/g, "");

    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  }

  return cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: 10,
  },
});

export const uploadSingle = upload.single("file");
export const uploadMany = upload.array("files", 10);

export default upload;
