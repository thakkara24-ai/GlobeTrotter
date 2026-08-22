import { Router } from 'express';
import { getCities, getCityById } from '../controllers/cityController';

const router = Router();

// Publicly readable or accessible with optional auth
router.get('/', getCities);
router.get('/:id', getCityById);

export default router;
