import { Router } from 'express';
import { getTripBudget, applyRecommendation } from '../controllers/budgetController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/:tripId', getTripBudget);
router.post('/:tripId/apply-recommendation', applyRecommendation);

export default router;
