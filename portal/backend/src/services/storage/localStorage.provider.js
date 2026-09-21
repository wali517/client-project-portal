import fs from 'node:fs/promises';
import path from 'node:path';
import env from '../../config/env.js';

/**
 * Local disk storage provider. Any other provider (S3, Cloudinary, GCS)
 * only needs to implement the same four methods.
 */
const localStorageProvider = {
  name: 'local',

  /** @param {Express.Multer.File} file */
  async save(file) {
    return {
      storedName: file.filename,
      storageKey: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  },

  resolvePath(storageKey) {
    // Normalise and confine the key to the upload directory - no traversal.
    const safeKey = path.basename(String(storageKey));
    return path.join(env.uploadDir, safeKey);
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
