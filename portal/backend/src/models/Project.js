import mongoose from 'mongoose';
import { PROJECT_STATUS, PROJECT_STATUS_VALUES, PRIORITY, PRIORITY_VALUES, SERVICE_TYPES } from '../constants/statuses.js';

const projectSchema = new mongoose.Schema(
  {
    projectNumber: { type: String, unique: true, index: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    serviceType: { type: String, enum: SERVICE_TYPES, required: true, index: true },
    priority: { type: String, enum: PRIORITY_VALUES, default: PRIORITY.MEDIUM, index: true },
    deadline: { type: Date, index: true },
    budget: { type: Number, min: 0, default: 0 },
    instructions: { type: String, trim: true, maxlength: 5000, default: '' },
    status: { type: String, enum: PROJECT_STATUS_VALUES, default: PROJECT_STATUS.NOT_STARTED, index: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date },
    adminApprovedAt: { type: Date },
    completedAt: { type: Date },
    approvedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true, maxlength: 2000 },
    clientFeedback: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

projectSchema.index({ title: 'text', description: 'text', projectNumber: 'text' });
projectSchema.index({ client: 1, status: 1, createdAt: -1 });
projectSchema.index({ status: 1, deadline: 1 });
projectSchema.index({ createdAt: -1 });

projectSchema.virtual('assignments', {
  ref: 'ProjectAssignment',
  localField: '_id',
  foreignField: 'project',
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
