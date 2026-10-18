import mongoose from 'mongoose';

export const EMAIL_STATUSES = {
  SCHEDULED: 'scheduled',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const emailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    recipient: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid recipient email address'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Email body is required'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EMAIL_STATUSES),
      default: EMAIL_STATUSES.SCHEDULED,
      index: true,
    },
    jobId: {
      type: String,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    sentAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    lastError: {
      type: String,
    },
    etherealPreviewUrl: {
      type: String,
    },
    messageId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for user queries and status sorting
emailSchema.index({ userId: 1, status: 1 });
emailSchema.index({ userId: 1, scheduledAt: -1 });
emailSchema.index({ userId: 1, createdAt: -1 });
emailSchema.index({ status: 1, scheduledAt: 1 });

export const Email = mongoose.model('Email', emailSchema);
