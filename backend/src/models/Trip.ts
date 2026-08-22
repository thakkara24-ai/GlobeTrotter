import mongoose, { Schema, Document } from 'mongoose';

export enum TripStatus {
  PLANNING = 'PLANNING',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
}

export interface ITrip extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  coverImage?: string;
  cities: mongoose.Types.ObjectId[];
  activities: mongoose.Types.ObjectId[];
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
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
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    coverImage: {
      type: String,
      default: undefined,
    },
    cities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'City',
      },
    ],
    activities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
    status: {
      type: String,
      enum: Object.values(TripStatus),
      default: TripStatus.PLANNING,
    },
  },
  {
    timestamps: true,
  }
);

// Validate startDate <= endDate
tripSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'End date must be on or after start date');
  }
  next();
});

// Indexes
tripSchema.index({ user: 1, createdAt: -1 });
tripSchema.index({ startDate: 1 });
tripSchema.index({ status: 1 });

const Trip = mongoose.model<ITrip>('Trip', tripSchema);

export default Trip;
