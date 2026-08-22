import { Router } from 'express';
import { listActivities, getActivityById } from '../controllers/activity.controller';
import { getNearbyActivities, updateActivityLocation } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/activities/nearby — Find nearby activities within radius
 * (Declared before /:id to prevent route collision)
 */
router.get('/nearby', getNearbyActivities);

/**
 * GET /api/activities — List activities
 */
router.get('/', listActivities);

/**
 * GET /api/activities/:id — Get activity by ID
 */
router.get('/:id', getActivityById);

/**
 * PUT /api/activities/:id/location — Update activity coordinates (auth required)
 */
router.put('/:id/location', authenticate, updateActivityLocation);

export default router;
