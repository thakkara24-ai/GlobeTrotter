import mongoose from 'mongoose';
import CommunityPost, { ICommunityPost } from '../models/CommunityPost';
import PostLike from '../models/PostLike';
import PostComment, { IPostComment } from '../models/PostComment';
import City from '../models/City';
import Trip from '../models/Trip';
import User from '../models/User';
import collaboratorService from './collaborator.service';
import {
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  UpdateCommentInput,
  CommunityQueryInput,
} from '../validators/community.validator';
import { PaginatedResult } from './city.service';

class CommunityService {
  /**
   * POST /api/community/posts
   * Creates a new community post.
   */
  async createPost(
    userId: string,
    data: CreatePostInput
  ): Promise<ICommunityPost> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      (error as any).statusCode = 400;
      throw error;
    }

    // Validate city if specified
    if (data.cityId) {
      if (!mongoose.Types.ObjectId.isValid(data.cityId)) {
        const error = new Error('Invalid city ID');
        (error as any).statusCode = 400;
        throw error;
      }
      const city = await City.findById(data.cityId);
      if (!city) {
        const error = new Error('City not found');
        (error as any).statusCode = 404;
        throw error;
      }
    }

    // Validate trip if specified
    if (data.tripId) {
      if (!mongoose.Types.ObjectId.isValid(data.tripId)) {
        const error = new Error('Invalid trip ID');
        (error as any).statusCode = 400;
        throw error;
      }
      // Verify author has access to the trip they are referencing
      await collaboratorService.requireTripAccess(data.tripId, userId, 'VIEWER');
    }

    // Normalize tags
    const normalizedTags = (data.tags || [])
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const post = await CommunityPost.create({
      author: userId,
      content: data.content,
      images: data.images || [],
      tripId: data.tripId || undefined,
      cityId: data.cityId || undefined,
      tags: normalizedTags,
      likeCount: 0,
      commentCount: 0,
    });

    return post.populate([
      { path: 'author', select: '_id name username avatar' },
      { path: 'cityId', select: '_id name country countryCode' },
      { path: 'tripId', select: '_id title startDate endDate coverImage' },
    ]);
  }

  /**
   * GET /api/community/posts
   * Lists posts with filtering and pagination.
   */
  async getPosts(
    options: CommunityQueryInput
  ): Promise<PaginatedResult<ICommunityPost>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    // Filter by city / cityId
    if (options.cityId && mongoose.Types.ObjectId.isValid(options.cityId)) {
      filter.cityId = options.cityId;
    } else if (options.city) {
      const cityMatch = await City.findOne({
        name: { $regex: new RegExp(options.city, 'i') },
      });
      if (cityMatch) {
        filter.cityId = cityMatch._id;
      }
    }

    // Filter by tag
    if (options.tag) {
      filter.tags = options.tag.trim().toLowerCase();
    }

    // Filter by author / authorId
    if (options.authorId && mongoose.Types.ObjectId.isValid(options.authorId)) {
      filter.author = options.authorId;
    } else if (options.author) {
      const userMatch = await User.findOne({
        $or: [
          { username: options.author.trim().toLowerCase() },
          { name: { $regex: new RegExp(options.author, 'i') } },
        ],
      });
      if (userMatch) {
        filter.author = userMatch._id;
      }
    }

    // Text search in content or tags
    if (options.search && options.search.trim() !== '') {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      filter.$or = [{ content: searchRegex }, { tags: searchRegex }];
    }

    const [items, total] = await Promise.all([
      CommunityPost.find(filter)
        .populate('author', '_id name username avatar')
        .populate('cityId', '_id name country countryCode')
        .populate('tripId', '_id title startDate endDate coverImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CommunityPost.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/community/posts/:postId
   * Retrieves single post detail.
   */
  async getPostById(postId: string): Promise<ICommunityPost> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error('Invalid post ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const post = await CommunityPost.findById(postId)
      .populate('author', '_id name username avatar bio location')
      .populate('cityId', '_id name country countryCode image')
      .populate('tripId', '_id title startDate endDate coverImage');

    if (!post) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return post;
  }

  /**
   * PUT /api/community/posts/:postId
   * Updates an existing post (Author only).
   */
  async updatePost(
    postId: string,
    userId: string,
    data: UpdatePostInput
  ): Promise<ICommunityPost> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error('Invalid post ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (post.author.toString() !== userId) {
      const error = new Error('You do not have permission to edit this post');
      (error as any).statusCode = 403;
      throw error;
    }

    if (data.cityId !== undefined) {
      if (data.cityId) {
        if (!mongoose.Types.ObjectId.isValid(data.cityId)) {
          const error = new Error('Invalid city ID');
          (error as any).statusCode = 400;
          throw error;
        }
        const city = await City.findById(data.cityId);
        if (!city) {
          const error = new Error('City not found');
          (error as any).statusCode = 404;
          throw error;
        }
        post.cityId = new mongoose.Types.ObjectId(data.cityId);
      } else {
        post.cityId = undefined;
      }
    }

    if (data.tripId !== undefined) {
      if (data.tripId) {
        if (!mongoose.Types.ObjectId.isValid(data.tripId)) {
          const error = new Error('Invalid trip ID');
          (error as any).statusCode = 400;
          throw error;
        }
        await collaboratorService.requireTripAccess(data.tripId, userId, 'VIEWER');
        post.tripId = new mongoose.Types.ObjectId(data.tripId);
      } else {
        post.tripId = undefined;
      }
    }

    if (data.content !== undefined) post.content = data.content;
    if (data.images !== undefined) post.images = data.images;
    if (data.tags !== undefined) {
      post.tags = data.tags
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
    }

    await post.save();

    return post.populate([
      { path: 'author', select: '_id name username avatar' },
      { path: 'cityId', select: '_id name country countryCode' },
      { path: 'tripId', select: '_id title startDate endDate coverImage' },
    ]);
  }

  /**
   * DELETE /api/community/posts/:postId
   * Deletes a post and cascades likes and comments (Author only).
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error('Invalid post ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (post.author.toString() !== userId) {
      const error = new Error('You do not have permission to delete this post');
      (error as any).statusCode = 403;
      throw error;
    }

    // Cascade delete likes and comments
    await Promise.all([
      PostLike.deleteMany({ post: postId }),
      PostComment.deleteMany({ post: postId }),
      CommunityPost.findByIdAndDelete(postId),
    ]);
  }

  /**
   * POST /api/community/posts/:postId/like
   * Likes a post (idempotent, prevents duplicate likes).
   */
  async likePost(
    postId: string,
    userId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error('Invalid post ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Check if like already exists
    const existing = await PostLike.findOne({ post: postId, user: userId });
    if (existing) {
      return { liked: true, likeCount: post.likeCount };
    }

    try {
      await PostLike.create({ post: postId, user: userId });
      const updated = await CommunityPost.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: 1 } },
        { new: true }
      );
      return { liked: true, likeCount: updated?.likeCount || post.likeCount + 1 };
    } catch (err: any) {
      // If concurrent request triggered unique constraint
      if (err.code === 11000) {
        const fresh = await CommunityPost.findById(postId);
        return { liked: true, likeCount: fresh?.likeCount || post.likeCount };
      }
      throw err;
    }
  }

  /**
   * DELETE /api/community/posts/:postId/like
   * Removes a like from a post (idempotent).
   */
  async unlikePost(
    postId: string,
    userId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error('Invalid post ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const deleted = await PostLike.findOneAndDelete({
      post: postId,
      user: userId,
    });

    if (deleted) {
      const updated = await CommunityPost.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: -1 } },
        { new: true }
      );
      const finalCount = Math.max(0, updated?.likeCount || 0);
      if (updated && updated.likeCount < 0) {
        await CommunityPost.findByIdAndUpdate(postId, { $set: { likeCount: 0 } });
      }
      return { liked: false, likeCount: finalCount };
    }

    return { liked: false, likeCount: post.likeCount };
  }

  /**
   * POST /api/community/posts/:postId/comments
   * Creates a comment on a post.
   */
  async createComment(
    postId: string,
    userId: string,
    data: CreateCommentInput
  ): Promise<IPostComment> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error('Invalid post ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const comment = await PostComment.create({
      post: postId,
      author: userId,
      content: data.content,
    });

    await CommunityPost.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });

    return comment.populate('author', '_id name username avatar');
  }

  /**
   * GET /api/community/posts/:postId/comments
   * Lists comments on a post.
   */
  async getComments(
    postId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<IPostComment>> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error('Invalid post ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PostComment.find({ post: postId })
        .populate('author', '_id name username avatar')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      PostComment.countDocuments({ post: postId }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * PUT /api/community/posts/:postId/comments/:commentId
   * Updates a comment (Author only).
   */
  async updateComment(
    postId: string,
    commentId: string,
    userId: string,
    data: UpdateCommentInput
  ): Promise<IPostComment> {
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      const error = new Error('Invalid ID format');
      (error as any).statusCode = 400;
      throw error;
    }

    const comment = await PostComment.findOne({ _id: commentId, post: postId });
    if (!comment) {
      const error = new Error('Comment not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (comment.author.toString() !== userId) {
      const error = new Error(
        'You do not have permission to edit this comment'
      );
      (error as any).statusCode = 403;
      throw error;
    }

    comment.content = data.content;
    await comment.save();

    return comment.populate('author', '_id name username avatar');
  }

  /**
   * DELETE /api/community/posts/:postId/comments/:commentId
   * Deletes a comment (Author only).
   */
  async deleteComment(
    postId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      const error = new Error('Invalid ID format');
      (error as any).statusCode = 400;
      throw error;
    }

    const comment = await PostComment.findOne({ _id: commentId, post: postId });
    if (!comment) {
      const error = new Error('Comment not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (comment.author.toString() !== userId) {
      const error = new Error(
        'You do not have permission to delete this comment'
      );
      (error as any).statusCode = 403;
      throw error;
    }

    await PostComment.findByIdAndDelete(commentId);
    await CommunityPost.findByIdAndUpdate(postId, {
      $inc: { commentCount: -1 },
    });
  }

  /**
   * GET /api/community/feed
   * Returns recent community feed.
   */
  async getFeed(
    options: CommunityQueryInput
  ): Promise<PaginatedResult<ICommunityPost>> {
    return this.getPosts(options);
  }

  /**
   * GET /api/community/users
   * Returns active/public community users.
   */
  async getDiscoveryUsers(
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const filter = {
      username: { $exists: true, $ne: null },
    };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('_id name username avatar bio location country travelInterests preferredTravelStyle createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/community/tags
   * Returns popular tags across community posts.
   */
  async getPopularTags(): Promise<Array<{ tag: string; count: number }>> {
    const results = await CommunityPost.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]);

    return results;
  }
}

export default new CommunityService();
