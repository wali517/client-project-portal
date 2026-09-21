import mongoose from 'mongoose';
import { ASSIGNMENT_STATUS, ASSIGNMENT_STATUS_VALUES } from '../constants/statuses.js';

const projectAssignmentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, default: Date.now },
    removedAt: { type: Date },
    status: { type: String, enum: ASSIGNMENT_STATUS_VALUES, default: ASSIGNMENT_STATUS.ACTIVE, index: true },
  },
  { timestamps: true }
);

projectAssignmentSchema.index({ project: 1, staff: 1 }, { unique: true });
projectAssignmentSchema.index({ staff: 1, status: 1 });

const ProjectAssignment = mongoose.model('ProjectAssignment', projectAssignmentSchema);
export default ProjectAssignment;
