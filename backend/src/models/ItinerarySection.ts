import mongoose, { Schema, Document } from 'mongoose';

export enum ItinerarySectionType {
  ACTIVITY = 'ACTIVITY',
  MEAL = 'MEAL',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}

export interface IItinerarySection extends Document {
  tripId: mongoose.Types.ObjectId;
  stopId: mongoose.Types.ObjectId;
  type: ItinerarySectionType;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  estimatedCost: number;
  activityId?: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const itinerarySectionSchema = new Schema<IItinerarySection>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip ID is required'],
      index: true,
    },
    stopId: {
      type: Schema.Types.ObjectId,
      ref: 'TripStop',
      required: [true, 'Stop ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ItinerarySectionType),
      default: ItinerarySectionType.ACTIVITY,
      required: [true, 'Section type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [300, 'Title must be at most 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      trim: true,
      default: undefined,
    },
    endTime: {
      type: String,
      trim: true,
      default: undefined,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, 'Estimated cost cannot be negative'],
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      default: undefined,
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      default: 1,
      min: [1, 'Order must be a positive number'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying and ordering
itinerarySectionSchema.index({ tripId: 1, stopId: 1, order: 1 });
itinerarySectionSchema.index({ stopId: 1, date: 1 });
itinerarySectionSchema.index({ activityId: 1 });

const ItinerarySection = mongoose.model<IItinerarySection>(
  'ItinerarySection',
  itinerarySectionSchema
);

export default ItinerarySection;
