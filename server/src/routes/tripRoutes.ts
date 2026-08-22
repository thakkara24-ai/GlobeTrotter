import { Router } from 'express';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  toggleShare,
} from '../controllers/tripController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { createTripSchema, updateTripSchema } from '../validators/tripValidator';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createTripSchema), createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.put('/:id', validateRequest(updateTripSchema), updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/share', toggleShare);

export default router;
