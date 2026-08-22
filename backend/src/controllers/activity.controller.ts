import { Request, Response, NextFunction } from 'express';
import { activityQuerySchema } from '../validators/activity.validator';
import activityService from '../services/activity.service';

/**
 * GET /api/activities
 */
export const listActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = activityQuerySchema.parse(req.query);
    const result = await activityService.listActivities(query);

    res.json({
      success: true,
      data: {
        activities: result.items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/activities/:id
 */
export const getActivityById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activity = await activityService.getActivityById(req.params.id as string);

    res.json({
      success: true,
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};
