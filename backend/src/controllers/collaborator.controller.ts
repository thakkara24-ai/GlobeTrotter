import { Request, Response, NextFunction } from 'express';
import collaboratorService from '../services/collaborator.service';
import {
  addCollaboratorSchema,
  updateCollaboratorRoleSchema,
} from '../validators/collaborator.validator';

/**
 * POST /api/trips/:tripId/collaborators
 */
export const addCollaborator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const ownerId = req.user!._id.toString();
    const body = addCollaboratorSchema.parse(req.body);

    const collaborator = await collaboratorService.addCollaborator(
      tripId,
      ownerId,
      body
    );

    res.status(201).json({
      success: true,
      data: { collaborator },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/collaborators
 */
export const listCollaborators = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!._id.toString();

    const collaborators = await collaboratorService.listCollaborators(
      tripId,
      userId
    );

    res.json({
      success: true,
      data: { collaborators },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:tripId/collaborators/:collaboratorId
 */
export const updateCollaboratorRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const collaboratorId = req.params.collaboratorId as string;
    const ownerId = req.user!._id.toString();
    const body = updateCollaboratorRoleSchema.parse(req.body);

    const collaborator = await collaboratorService.updateCollaboratorRole(
      tripId,
      collaboratorId,
      ownerId,
      body.role
    );

    res.json({
      success: true,
      data: { collaborator },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:tripId/collaborators/:collaboratorId
 */
export const removeCollaborator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const collaboratorId = req.params.collaboratorId as string;
    const ownerId = req.user!._id.toString();

    await collaboratorService.removeCollaborator(
      tripId,
      collaboratorId,
      ownerId
    );

    res.json({
      success: true,
      data: { message: 'Collaborator removed successfully' },
    });
  } catch (error) {
    next(error);
  }
};
