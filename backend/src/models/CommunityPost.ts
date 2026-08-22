import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  images: string[];
  tripId?: mongoose.Types.ObjectId;
  cityId?: mongoose.Types.ObjectId;
  tags: string[];
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [1, 'Content cannot be empty'],
      maxlength: [3000, 'Content must be at most 3000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      default: undefined,
      index: true,
    },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      default: undefined,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: [0, 'Like count cannot be negative'],
    },
    commentCount: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for feed and queries
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ cityId: 1, createdAt: -1 });
communityPostSchema.index({ tags: 1, createdAt: -1 });

const CommunityPost = mongoose.model<ICommunityPost>(
  'CommunityPost',
  communityPostSchema
);

export default CommunityPost;
