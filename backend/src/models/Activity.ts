import mongoose, { Schema, Document } from 'mongoose';

export enum ActivityCategory {
  SIGHTSEEING = 'sightseeing',
  FOOD = 'food',
  ADVENTURE = 'adventure',
  CULTURE = 'culture',
  SHOPPING = 'shopping',
  NATURE = 'nature',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

export interface IActivity extends Document {
  city: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: ActivityCategory;
  estimatedCost: number;
  currency: string;
  durationMinutes: number;
  image?: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    city: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City is required'],
    },
    name: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true,
      minlength: [1, 'Activity name must be at least 1 character'],
      maxlength: [300, 'Activity name must be at most 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    category: {
      type: String,
      enum: Object.values(ActivityCategory),
      required: [true, 'Category is required'],
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [0, 'Estimated cost cannot be negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
      uppercase: true,
      default: 'USD',
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    image: {
      type: String,
      default: undefined,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activitySchema.index({ city: 1 });
activitySchema.index({ category: 1 });
activitySchema.index({ name: 'text', description: 'text' });

const Activity = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;
