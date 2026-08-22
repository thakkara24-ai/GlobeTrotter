import mongoose, { Schema, Document } from 'mongoose';

export interface IGeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ICity extends Document {
  name: string;
  country: string;
  countryCode: string;
  description: string;
  image?: string;
  latitude: number;
  longitude: number;
  location: IGeoLocation;
  timezone: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
      minlength: [1, 'City name must be at least 1 character'],
      maxlength: [200, 'City name must be at most 200 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Country code must be 2 characters'],
      maxlength: [3, 'Country code must be at most 3 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    image: {
      type: String,
      default: undefined,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0],
      },
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      trim: true,
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

// Keep location coordinates and lat/lon synchronized
citySchema.pre('validate', function (next) {
  if (this.latitude !== undefined && this.longitude !== undefined) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  } else if (
    this.location &&
    Array.isArray(this.location.coordinates) &&
    this.location.coordinates.length === 2
  ) {
    this.longitude = this.location.coordinates[0];
    this.latitude = this.location.coordinates[1];
  }
  next();
});

// Indexes for searchable and geospatial fields
citySchema.index({ name: 'text', country: 'text' });
citySchema.index({ countryCode: 1 });
citySchema.index({ isActive: 1 });
citySchema.index({ location: '2dsphere' });

const City = mongoose.model<ICity>('City', citySchema);

export default City;
