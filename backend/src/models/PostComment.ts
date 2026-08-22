import mongoose, { Schema, Document } from 'mongoose';

export interface IPostComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const postCommentSchema = new Schema<IPostComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: [true, 'Post reference is required'],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment must be at most 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for retrieving comments on a post ordered by date
postCommentSchema.index({ post: 1, createdAt: -1 });

const PostComment = mongoose.model<IPostComment>(
  'PostComment',
  postCommentSchema
);

export default PostComment;
