import { Router } from 'express';
import { getDistance } from '../controllers/location.controller';

const router = Router();

/**
 * GET /api/location/distance — Calculate straight-line distance between two coordinates
 */
router.get('/distance', getDistance);

export default router;
