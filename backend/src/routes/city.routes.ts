import { Router } from 'express';
import { listCities, getCityById } from '../controllers/city.controller';

const router = Router();

/**
 * GET /api/cities — public
 */
router.get('/', listCities);

/**
 * GET /api/cities/:id — public
 */
router.get('/:id', getCityById);

export default router;
