import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface IUser extends Document {
  name: string;
  email: string;
  username?: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  location?: string;
  country?: string;
  travelInterests: string[];
  preferredTravelStyle: string;
  languagePreference: string;
  savedDestinations: mongoose.Types.ObjectId[];
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): IUserSafe;
  toPublicProfile(): IUserPublic;
}

export interface IUserSafe {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  country?: string;
  travelInterests: string[];
  preferredTravelStyle: string;
  languagePreference: string;
  savedDestinations: mongoose.Types.ObjectId[];
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  country?: string;
  travelInterests: string[];
  preferredTravelStyle: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      sparse: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain alphanumeric characters and underscores',
      ],
      default: undefined,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned by default
    },
    avatar: {
      type: String,
      default: undefined,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must be at most 500 characters'],
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location must be at most 100 characters'],
      default: '',
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country must be at most 100 characters'],
      default: '',
    },
    travelInterests: {
      type: [String],
      default: [],
    },
    preferredTravelStyle: {
      type: String,
      trim: true,
      default: 'standard',
    },
    languagePreference: {
      type: String,
      default: 'en',
      trim: true,
    },
    savedDestinations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'City',
      },
    ],
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ username: 1 }, { sparse: true, unique: true });

/**
 * Returns a safe user object without passwordHash.
 */
userSchema.methods.toSafeObject = function (): IUserSafe {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

/**
 * Returns safe public profile fields.
 */
userSchema.methods.toPublicProfile = function (): IUserPublic {
  return {
    _id: this._id.toString(),
    name: this.name,
    username: this.username || undefined,
    avatar: this.avatar || undefined,
    bio: this.bio || '',
    location: this.location || '',
    country: this.country || '',
    travelInterests: this.travelInterests || [],
    preferredTravelStyle: this.preferredTravelStyle || 'standard',
    createdAt: this.createdAt,
  };
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
