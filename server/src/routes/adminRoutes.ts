import { Router } from 'express';
import { getAdminStats } from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);

export default router;
