import mongoose from 'mongoose';
import { REVISION_STATUS, REVISION_STATUS_VALUES } from '../constants/statuses.js';
import { ROLE_VALUES } from '../constants/roles.js';

const revisionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedByRole: { type: String, enum: ROLE_VALUES, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    instructions: { type: String, trim: true, maxlength: 4000, default: '' },
    status: { type: String, enum: REVISION_STATUS_VALUES, default: REVISION_STATUS.OPEN, index: true },
    submittedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

revisionSchema.index({ project: 1, createdAt: -1 });

const Revision = mongoose.model('Revision', revisionSchema);
export default Revision;
