import { Router } from 'express';
import {
  getTripItinerary,
  addStop,
  updateStop,
  deleteStop,
  addSection,
  updateSection,
  deleteSection,
} from '../controllers/itineraryController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import {
  createStopSchema,
  updateStopSchema,
  createSectionSchema,
  updateSectionSchema,
} from '../validators/itineraryValidator';

const router = Router();

router.use(authenticate);

// Itinerary overall
router.get('/:tripId', getTripItinerary);

// Stops (City destinations in trip)
router.post('/:tripId/stops', validateRequest(createStopSchema), addStop);
router.put('/:tripId/stops/:stopId', validateRequest(updateStopSchema), updateStop);
router.delete('/:tripId/stops/:stopId', deleteStop);

// Sections (Travel, Hotel, Activity, Meals, etc.)
router.post('/:tripId/sections', validateRequest(createSectionSchema), addSection);
router.put('/:tripId/sections/:sectionId', validateRequest(updateSectionSchema), updateSection);
router.delete('/:tripId/sections/:sectionId', deleteSection);

export default router;
