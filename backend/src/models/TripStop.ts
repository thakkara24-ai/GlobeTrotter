import mongoose, { Schema, Document } from 'mongoose';

export interface ITripStop extends Document {
  tripId: mongoose.Types.ObjectId;
  cityId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

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
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
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

// Validate startDate <= endDate
tripStopSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'End date must be on or after start date');
  }
  next();
});

// Compound index for ordered retrieval of stops by trip
tripStopSchema.index({ tripId: 1, order: 1 });

const TripStop = mongoose.model<ITripStop>('TripStop', tripStopSchema);

export default TripStop;
