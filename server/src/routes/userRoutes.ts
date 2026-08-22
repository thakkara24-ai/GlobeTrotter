import { Router } from 'express';
import { updateProfile, toggleSaveDestination, deleteAccount } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { updateProfileSchema } from '../validators/authValidator';

const router = Router();

router.use(authenticate);

router.put('/profile', validateRequest(updateProfileSchema), updateProfile);
router.post('/saved-destinations/:cityId', toggleSaveDestination);
router.delete('/account', deleteAccount);

export default router;
