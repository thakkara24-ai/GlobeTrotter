import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getItinerary,
  createStop,
  updateStop,
  deleteStop,
  reorderStops,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '../controllers/itinerary.controller';

const router = Router({ mergeParams: true });

// All itinerary routes require authentication
router.use(authenticate);

/**
 * GET /api/trips/:id/itinerary — Get full trip itinerary
 */
router.get('/:id/itinerary', getItinerary);

/**
 * POST /api/trips/:id/stops — Create a new stop
 */
router.post('/:id/stops', createStop);

/**
 * PUT /api/trips/:id/stops/reorder — Reorder stops
 * (Declared before /:id/stops/:stopId to avoid route collision)
 */
router.put('/:id/stops/reorder', reorderStops);

/**
 * PUT /api/trips/:id/stops/:stopId — Update a stop
 */
router.put('/:id/stops/:stopId', updateStop);

/**
 * DELETE /api/trips/:id/stops/:stopId — Delete a stop
 */
router.delete('/:id/stops/:stopId', deleteStop);

/**
 * POST /api/trips/:id/stops/:stopId/sections — Create an itinerary section
 */
router.post('/:id/stops/:stopId/sections', createSection);

/**
 * PUT /api/trips/:id/stops/:stopId/sections/reorder — Reorder sections
 * (Declared before /:id/stops/:stopId/sections/:sectionId to avoid route collision)
 */
router.put('/:id/stops/:stopId/sections/reorder', reorderSections);

/**
 * PUT /api/trips/:id/stops/:stopId/sections/:sectionId — Update an itinerary section
 */
router.put('/:id/stops/:stopId/sections/:sectionId', updateSection);

/**
 * DELETE /api/trips/:id/stops/:stopId/sections/:sectionId — Delete an itinerary section
 */
router.delete('/:id/stops/:stopId/sections/:sectionId', deleteSection);

export default router;
