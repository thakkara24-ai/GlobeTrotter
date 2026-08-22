import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} from '../controllers/trip.controller';

const router = Router();

// All trip routes require authentication
router.use(authenticate);

/**
 * POST /api/trips — create a trip
 */
router.post('/', createTrip);

/**
 * GET /api/trips — list my trips
 */
router.get('/', getMyTrips);

/**
 * GET /api/trips/:id — get a single trip
 */
router.get('/:id', getTripById);

/**
 * PUT /api/trips/:id — update a trip
 */
router.put('/:id', updateTrip);

/**
 * DELETE /api/trips/:id — delete a trip
 */
router.delete('/:id', deleteTrip);

export default router;
