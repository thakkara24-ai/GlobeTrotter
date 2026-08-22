import { Router } from 'express';
import {
  getCommunityPosts,
  createCommunityPost,
  toggleLikePost,
} from '../controllers/communityController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Publicly browse community posts
router.get('/', getCommunityPosts);

// Authenticated actions
router.post('/', authenticate, createCommunityPost);
router.post('/:id/like', authenticate, toggleLikePost);

export default router;
