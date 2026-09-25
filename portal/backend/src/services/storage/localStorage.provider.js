import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import env from "../../config/env.js";

const localStorageProvider = {
  name: "local",
  async save(file) {
    const uploadDir = process.env.VERCEL
      ? "/tmp/cpm-portal-uploads"
      : env.uploadDir;
    await fs.mkdir(uploadDir, { recursive: true });
    let storedName = file.filename;
    if (!storedName) {
      const ext = path
        .extname(file.originalname || "")
        .toLowerCase()
        .slice(0, 12)
        .replace(/[^a-z0-9.]/g, "");
      storedName = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext || ".bin"}`;
    }

    const targetPath = path.join(uploadDir, storedName);
    if (file.buffer) {
      await fs.writeFile(targetPath, file.buffer);
    } else if (file.path && file.path !== targetPath) {
      try {
        await fs.access(file.path);
      } catch {}
    }
    return {
      storedName,
      storageKey: storedName,
      size: file.size,
      mimeType: file.mimetype,
    };
  },

  resolvePath(storageKey) {
    const uploadDir = process.env.VERCEL
      ? "/tmp/cpm-portal-uploads"
      : env.uploadDir;
    const safeKey = path.basename(String(storageKey));
    return path.join(uploadDir, safeKey);
  },

  async getStream(storageKey) {
    const filePath = this.resolvePath(storageKey);
    await fs.access(filePath);
    return filePath;
  },

  async remove(storageKey) {
    try {
      await fs.unlink(this.resolvePath(storageKey));
      return true;
    } catch {
      return false;
    }
  },
};

export default localStorageProvider;
