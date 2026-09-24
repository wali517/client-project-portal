import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', index: true },
    channel: { type: String, enum: ['CLIENT', 'STAFF'], default: 'CLIENT', index: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

messageSchema.index({ project: 1, createdAt: -1 });
messageSchema.index({ request: 1, createdAt: -1 });
messageSchema.index({ project: 1, channel: 1, createdAt: -1 });
messageSchema.index({ request: 1, channel: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
