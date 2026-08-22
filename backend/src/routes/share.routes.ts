import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  enablePublicShare,
  disablePublicShare,
} from '../controllers/share.controller';

const router = Router({ mergeParams: true });

// Protected share settings require authentication
router.use(authenticate);

/**
 * POST /api/trips/:tripId/share/public — Enable public sharing and generate token (Owner only)
 */
router.post('/:tripId/share/public', enablePublicShare);

/**
 * DELETE /api/trips/:tripId/share/public — Disable public sharing and revoke token (Owner only)
 */
router.delete('/:tripId/share/public', disablePublicShare);

export default router;
