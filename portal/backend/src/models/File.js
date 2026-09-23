import mongoose from 'mongoose';
import { FILE_CATEGORY, FILE_CATEGORY_VALUES } from '../constants/files.js';

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true },
    storageKey: { type: String, required: true },
    storageDriver: { type: String, default: 'mongodb' },
    data: { type: Buffer, select: false },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    category: { type: String, enum: FILE_CATEGORY_VALUES, default: FILE_CATEGORY.PROJECT_ATTACHMENT, index: true },
    version: { type: Number, default: 1 },
    replaces: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.storageKey;
        delete ret.__v;
        return ret;
      },
    },
  }
);

fileSchema.index({ project: 1, category: 1, createdAt: -1 });
fileSchema.index({ request: 1, createdAt: -1 });

const File = mongoose.model('File', fileSchema);
export default File;
