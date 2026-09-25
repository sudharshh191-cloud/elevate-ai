import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'resume_parsed'
  | 'interview_completed'
  | 'scorecard_ready'
  | 'scorecard_shared'
  | 'system_alert';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  referenceId?: string;
  referenceType?: 'InterviewSession' | 'FeedbackReport' | 'Resume' | 'System';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'resume_parsed',
        'interview_completed',
        'scorecard_ready',
        'scorecard_shared',
        'system_alert',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['InterviewSession', 'FeedbackReport', 'Resume', 'System'],
      default: 'System',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for fast per-user notification queries and unread counting
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
