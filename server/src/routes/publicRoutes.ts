import { Router } from 'express';
import { getSharedTrip, cloneSharedTrip } from '../controllers/publicController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Publicly readable trip via shareToken
router.get('/trips/:shareToken', getSharedTrip);

// Clone public trip into user account (requires auth)
router.post('/trips/:shareToken/clone', authenticate, cloneSharedTrip);

export default router;
