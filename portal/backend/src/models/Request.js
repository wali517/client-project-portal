import mongoose from 'mongoose';
import { REQUEST_STATUS, REQUEST_STATUS_VALUES, PRIORITY, PRIORITY_VALUES, SERVICE_TYPES } from '../constants/statuses.js';

const requestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, unique: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    serviceType: { type: String, enum: SERVICE_TYPES, required: true, index: true },
    priority: { type: String, enum: PRIORITY_VALUES, default: PRIORITY.MEDIUM, index: true },
    deadline: { type: Date },
    budget: { type: Number, min: 0, default: 0 },
    instructions: { type: String, trim: true, maxlength: 5000, default: '' },
    status: { type: String, enum: REQUEST_STATUS_VALUES, default: REQUEST_STATUS.NEW, index: true },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    adminNotes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        note: { type: String, required: true, trim: true, maxlength: 2000 },
        type: { type: String, enum: ['NOTE', 'APPROVE', 'REJECT'], default: 'NOTE' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    approvalNote: { type: String, trim: true, maxlength: 2000 },
    rejectionReason: { type: String, trim: true, maxlength: 2000 },
    convertedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

requestSchema.index({ title: 'text', description: 'text', requestNumber: 'text' });
requestSchema.index({ client: 1, status: 1, createdAt: -1 });
requestSchema.index({ createdAt: -1 });

const Request = mongoose.model('Request', requestSchema);
export default Request;
