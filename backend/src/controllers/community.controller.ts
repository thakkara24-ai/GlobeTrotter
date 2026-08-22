import { Request, Response, NextFunction } from 'express';
import communityService from '../services/community.service';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  communityQuerySchema,
} from '../validators/community.validator';

/**
 * POST /api/community/posts
 */
export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const validated = createPostSchema.parse(req.body);

    const post = await communityService.createPost(userId, validated);

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/posts
 */
export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = communityQuerySchema.parse(req.query);
    const result = await communityService.getPosts(validated);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/posts/:postId
 */
export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const postId = req.params.postId as string;
    const post = await communityService.getPostById(postId);

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/community/posts/:postId
 */
export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;
    const validated = updatePostSchema.parse(req.body);

    const post = await communityService.updatePost(postId, userId, validated);

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/community/posts/:postId
 */
export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;

    await communityService.deletePost(postId, userId);

    res.json({
      success: true,
      data: { message: 'Post deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/community/posts/:postId/like
 */
export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;

    const result = await communityService.likePost(postId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/community/posts/:postId/like
 */
export const unlikePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;

    const result = await communityService.unlikePost(postId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/community/posts/:postId/comments
 */
export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;
    const validated = createCommentSchema.parse(req.body);

    const comment = await communityService.createComment(
      postId,
      userId,
      validated
    );

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/posts/:postId/comments
 */
export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const postId = req.params.postId as string;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;

    const result = await communityService.getComments(postId, { page, limit });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/community/posts/:postId/comments/:commentId
 */
export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;
    const commentId = req.params.commentId as string;
    const validated = updateCommentSchema.parse(req.body);

    const comment = await communityService.updateComment(
      postId,
      commentId,
      userId,
      validated
    );

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/community/posts/:postId/comments/:commentId
 */
export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const postId = req.params.postId as string;
    const commentId = req.params.commentId as string;

    await communityService.deleteComment(postId, commentId, userId);

    res.json({
      success: true,
      data: { message: 'Comment deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/feed
 */
export const getFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = communityQuerySchema.parse(req.query);
    const result = await communityService.getFeed(validated);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/users
 */
export const getDiscoveryUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;

    const result = await communityService.getDiscoveryUsers({ page, limit });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/tags
 */
export const getPopularTags = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tags = await communityService.getPopularTags();

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};
