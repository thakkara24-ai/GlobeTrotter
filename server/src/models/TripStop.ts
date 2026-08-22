import mongoose, { Schema } from 'mongoose';
import { ITripStop } from '../types';

const tripStopSchema = new Schema<ITripStop>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip ID is required'],
      index: true,
    },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City ID is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Stop start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Stop end date is required'],
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

tripStopSchema.index({ tripId: 1, order: 1 });

export const TripStop = mongoose.model<ITripStop>('TripStop', tripStopSchema);
