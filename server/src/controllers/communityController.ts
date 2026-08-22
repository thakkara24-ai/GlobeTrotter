import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CommunityPost } from '../models/CommunityPost';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getCommunityPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, destination, sort } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { content: { $regex: search as string, $options: 'i' } },
        { destination: { $regex: search as string, $options: 'i' } },
      ];
    }
    if (destination) {
      query.destination = destination;
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likes: -1 };

    const posts = await CommunityPost.find(query)
      .populate('userId', 'name avatar')
      .populate('tripId', 'title startDate endDate coverImage')
      .sort(sortOption);

    sendSuccess(res, { posts });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch community posts', 500);
  }
};

export const createCommunityPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { title, content, destination, images, tags, tripId } = req.body;

    const post = await CommunityPost.create({
      userId,
      tripId: tripId || undefined,
      title,
      content,
      destination,
      images: images || [],
      tags: tags || [],
    });

    const populated = await CommunityPost.findById(post._id).populate('userId', 'name avatar');
    sendSuccess(res, { post: populated }, 'Experience shared with community', 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create post', 500);
  }
};

export const toggleLikePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await CommunityPost.findById(id);
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    const index = post.likes.findIndex((likeUserId) => likeUserId.toString() === userId);
    let isLiked = false;
    if (index > -1) {
      post.likes.splice(index, 1);
      isLiked = false;
    } else {
      post.likes.push(userId as any);
      isLiked = true;
    }

    await post.save();
    sendSuccess(res, { likesCount: post.likes.length, isLiked });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to like post', 500);
  }
};
