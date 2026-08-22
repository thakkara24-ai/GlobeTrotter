import { Router } from 'express';
import { listActivities, getActivityById } from '../controllers/activity.controller';

const router = Router();

/**
 * GET /api/activities — public
 */
router.get('/', listActivities);

/**
 * GET /api/activities/:id — public
 */
router.get('/:id', getActivityById);

export default router;
