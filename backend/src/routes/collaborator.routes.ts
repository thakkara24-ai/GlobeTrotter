import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  addCollaborator,
  listCollaborators,
  updateCollaboratorRole,
  removeCollaborator,
} from '../controllers/collaborator.controller';

const router = Router({ mergeParams: true });

// All collaborator routes require authentication
router.use(authenticate);

/**
 * POST /api/trips/:tripId/collaborators — Add a collaborator (Owner only)
 */
router.post('/:tripId/collaborators', addCollaborator);

/**
 * GET /api/trips/:tripId/collaborators — List collaborators (Owner or Collaborators)
 */
router.get('/:tripId/collaborators', listCollaborators);

/**
 * PUT /api/trips/:tripId/collaborators/:collaboratorId — Update collaborator role (Owner only)
 */
router.put(
  '/:tripId/collaborators/:collaboratorId',
  updateCollaboratorRole
);

/**
 * DELETE /api/trips/:tripId/collaborators/:collaboratorId — Remove collaborator (Owner only)
 */
router.delete(
  '/:tripId/collaborators/:collaboratorId',
  removeCollaborator
);

export default router;
