import mongoose, { Schema, Document } from 'mongoose';

export enum CollaboratorRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
}

export interface ITripCollaborator extends Document {
  trip: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: CollaboratorRole;
  createdAt: Date;
  updatedAt: Date;
}

const tripCollaboratorSchema = new Schema<ITripCollaborator>(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    role: {
      type: String,
      enum: Object.values(CollaboratorRole),
      default: CollaboratorRole.VIEWER,
      required: [true, 'Role is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tripCollaboratorSchema.index({ trip: 1, user: 1 }, { unique: true });
tripCollaboratorSchema.index({ trip: 1 });
tripCollaboratorSchema.index({ user: 1 });

const TripCollaborator = mongoose.model<ITripCollaborator>(
  'TripCollaborator',
  tripCollaboratorSchema
);

export default TripCollaborator;
