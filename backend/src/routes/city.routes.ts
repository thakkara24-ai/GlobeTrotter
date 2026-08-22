import { Router } from 'express';
import { listCities, getCityById } from '../controllers/city.controller';
import { getNearbyCities, updateCityLocation } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/cities/nearby — Find nearby cities within radius
 * (Declared before /:id to prevent route collision)
 */
router.get('/nearby', getNearbyCities);

/**
 * GET /api/cities — List cities
 */
router.get('/', listCities);

/**
 * GET /api/cities/:id — Get city by ID
 */
router.get('/:id', getCityById);

/**
 * PUT /api/cities/:id/location — Update city coordinates (auth required)
 */
router.put('/:id/location', authenticate, updateCityLocation);

export default router;
