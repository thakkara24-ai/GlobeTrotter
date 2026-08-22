import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  languagePreference: string;
  savedDestinations: mongoose.Types.ObjectId[];
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSafe {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  languagePreference: string;
  savedDestinations: mongoose.Types.ObjectId[];
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
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
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned by default
    },
    avatar: {
      type: String,
      default: undefined,
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

/**
 * Returns a safe user object without passwordHash.
 */
userSchema.methods.toSafeObject = function (): IUserSafe {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
