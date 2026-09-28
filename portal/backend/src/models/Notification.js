import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: {
      type: String,
      enum: [
        'MESSAGE',
        'PROJECT_ASSIGNED',
        'PROJECT_UNASSIGNED',
        'PROJECT_STATUS_CHANGED',
        'WORK_SUBMITTED',
        'REVISION_REQUESTED',
        'PROJECT_APPROVED',
        'REQUEST_CREATED',
        'REQUEST_STATUS_CHANGED',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', index: true },
    channel: { type: String, enum: ['CLIENT', 'STAFF'], default: 'CLIENT' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
