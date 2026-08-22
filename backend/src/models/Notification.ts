import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  COLLABORATOR_ADDED = 'COLLABORATOR_ADDED',
  COLLABORATOR_ROLE_UPDATED = 'COLLABORATOR_ROLE_UPDATED',
  COLLABORATOR_REMOVED = 'COLLABORATOR_REMOVED',
  TRIP_UPDATED = 'TRIP_UPDATED',
  ITINERARY_UPDATED = 'ITINERARY_UPDATED',
  POST_LIKED = 'POST_LIKED',
  POST_COMMENTED = 'POST_COMMENTED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  PUBLIC_SHARE_ENABLED = 'PUBLIC_SHARE_ENABLED',
  PUBLIC_SHARE_REVOKED = 'PUBLIC_SHARE_REVOKED',
  BUDGET_UPDATED = 'BUDGET_UPDATED',
  EXPENSE_ADDED = 'EXPENSE_ADDED',
  TRIP_OVER_BUDGET = 'TRIP_OVER_BUDGET',
  SYSTEM = 'SYSTEM',
}

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  actor?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  trip?: mongoose.Types.ObjectId;
  post?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, 'Notification type is required'],
      default: NotificationType.SYSTEM,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message must be at most 1000 characters'],
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      default: undefined,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      default: undefined,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant user inbox queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export default Notification;
