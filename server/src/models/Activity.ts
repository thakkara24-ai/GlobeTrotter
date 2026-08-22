import mongoose, { Schema } from 'mongoose';
import { IActivity } from '../types';

const activitySchema = new Schema<IActivity>(
  {
    name: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true,
      index: true,
    },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City ID is required'],
      index: true,
    },
    category: {
      type: String,
      enum: [
        'sightseeing',
        'food',
        'beach',
        'museum',
        'adventure',
        'culture',
        'entertainment',
        'nature',
      ],
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
      default: 0,
    },
    duration: {
      type: Number,
      default: 2, // in hours
      min: 0.5,
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    popularity: {
      type: Number,
      default: 85,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ name: 'text', description: 'text' });
activitySchema.index({ cityId: 1, category: 1, cost: 1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
