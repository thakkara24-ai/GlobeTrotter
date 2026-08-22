import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  createComment,
  getComments,
  updateComment,
  deleteComment,
  getFeed,
  getDiscoveryUsers,
  getPopularTags,
} from '../controllers/community.controller';

const router = Router();

/**
 * Feed & Discovery (Public)
 */
router.get('/feed', getFeed);
router.get('/users', getDiscoveryUsers);
router.get('/tags', getPopularTags);

/**
 * Posts
 */
router.post('/posts', authenticate, createPost);
router.get('/posts', getPosts);
router.get('/posts/:postId', getPostById);
router.put('/posts/:postId', authenticate, updatePost);
router.delete('/posts/:postId', authenticate, deletePost);

/**
 * Likes
 */
router.post('/posts/:postId/like', authenticate, likePost);
router.delete('/posts/:postId/like', authenticate, unlikePost);

/**
 * Comments
 */
router.post('/posts/:postId/comments', authenticate, createComment);
router.get('/posts/:postId/comments', getComments);
router.put('/posts/:postId/comments/:commentId', authenticate, updateComment);
router.delete('/posts/:postId/comments/:commentId', authenticate, deleteComment);

export default router;
