import mongoose, { Schema, Document } from 'mongoose';

export interface IPostLike extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postLikeSchema = new Schema<IPostLike>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: [true, 'Post reference is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a user can like a post only once
postLikeSchema.index({ post: 1, user: 1 }, { unique: true });

const PostLike = mongoose.model<IPostLike>('PostLike', postLikeSchema);

export default PostLike;
