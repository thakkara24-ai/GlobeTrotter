import mongoose, { Schema } from 'mongoose';
import { ICity } from '../types';

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    costIndex: {
      type: String,
      enum: ['Budget', 'Moderate', 'Luxury'],
      default: 'Moderate',
    },
    popularity: {
      type: Number,
      default: 80,
      min: 1,
      max: 100,
    },
    image: {
      type: String,
      required: [true, 'City image URL is required'],
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

citySchema.index({ name: 'text', country: 'text', region: 'text', description: 'text' });

export const City = mongoose.model<ICity>('City', citySchema);
