import mongoose, { Schema } from 'mongoose';
import { IItinerarySection } from '../types';

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
    },
    type: {
      type: String,
      enum: ['Travel', 'Hotel', 'Activity', 'Meals', 'Other'],
      default: 'Activity',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: {
      type: String, // e.g. "09:00"
      default: '09:00',
    },
    endTime: {
      type: String, // e.g. "11:30"
      default: '',
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [0, 'Cost cannot be negative'],
      default: 0,
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

itinerarySectionSchema.index({ tripId: 1, date: 1, order: 1 });

export const ItinerarySection = mongoose.model<IItinerarySection>(
  'ItinerarySection',
  itinerarySectionSchema
);
