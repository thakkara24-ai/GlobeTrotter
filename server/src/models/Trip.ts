import mongoose, { Schema } from 'mongoose';
import { ITrip } from '../types';
import crypto from 'crypto';

const tripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Planned budget is required'],
      min: [0, 'Budget cannot be negative'],
      default: 0,
    },
    coverImage: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    status: {
      type: String,
      enum: ['PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexing for rapid queries
tripSchema.index({ userId: 1, createdAt: -1 });

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
