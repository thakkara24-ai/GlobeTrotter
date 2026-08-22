import { Router } from 'express';
import { getPublicItinerary } from '../controllers/share.controller';

const router = Router();

/**
 * GET /api/public/trips/:shareToken — Public read-only trip itinerary (No Auth required)
 */
router.get('/trips/:shareToken', getPublicItinerary);

export default router;
