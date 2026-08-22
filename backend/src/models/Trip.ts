import mongoose, { Schema, Document } from 'mongoose';

export enum TripStatus {
  PLANNING = 'PLANNING',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
}

export interface ITripBudget {
  totalBudget: number;
  currency: string;
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
  travelers: number;
  budget: ITripBudget;
  publicShareEnabled: boolean;
  publicShareToken?: string | null;
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
    travelers: {
      type: Number,
      default: 1,
      min: [1, 'Travelers must be at least 1'],
    },
    budget: {
      totalBudget: {
        type: Number,
        default: 0,
        min: [0, 'Total budget cannot be negative'],
      },
      currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: 'USD',
        minlength: [3, 'Currency must be a 3-letter code'],
        maxlength: [3, 'Currency must be a 3-letter code'],
      },
    },
    publicShareEnabled: {
      type: Boolean,
      default: false,
    },
    publicShareToken: {
      type: String,
      default: undefined,
      trim: true,
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
tripSchema.index({ publicShareToken: 1 }, { sparse: true, unique: true });

const Trip = mongoose.model<ITrip>('Trip', tripSchema);

export default Trip;
