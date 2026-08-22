import mongoose, { Schema } from 'mongoose';
import { ICommunityPost } from '../types';

const communityPostSchema = new Schema<ICommunityPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    destination: {
      type: String,
      required: true,
      index: true,
    },
    images: [{ type: String }],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ destination: 'text', title: 'text', content: 'text' });

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', communityPostSchema);
