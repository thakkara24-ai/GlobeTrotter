import { Router } from 'express';
import { getPublicProfile } from '../controllers/profile.controller';

const router = Router();

// Public user profile route (no auth required)
router.get('/:username', getPublicProfile);

export default router;
