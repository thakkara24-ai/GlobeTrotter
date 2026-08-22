import { Request, Response, NextFunction } from 'express';
import { createTripSchema, updateTripSchema } from '../validators/trip.validator';
import tripService from '../services/trip.service';

/**
 * POST /api/trips
 */
export const createTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createTripSchema.parse(req.body);
    const userId = req.user!._id.toString();

    const trip = await tripService.createTrip(userId, validated);

    res.status(201).json({
      success: true,
      data: { trip },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips
 */
export const getMyTrips = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    const result = await tripService.getUserTrips(userId, page, limit);

    res.json({
      success: true,
      data: {
        trips: result.items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:id
 */
export const getTripById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const trip = await tripService.getTripById(req.params.id as string, userId);

    res.json({
      success: true,
      data: { trip },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:id
 */
export const updateTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = updateTripSchema.parse(req.body);
    const userId = req.user!._id.toString();

    const trip = await tripService.updateTrip(req.params.id as string, userId, validated);

    res.json({
      success: true,
      data: { trip },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:id
 */
export const deleteTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    await tripService.deleteTrip(req.params.id as string, userId);

    res.json({
      success: true,
      data: { message: 'Trip deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};
