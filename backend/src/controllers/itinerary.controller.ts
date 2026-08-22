import { Request, Response, NextFunction } from 'express';
import itineraryService from '../services/itinerary.service';
import {
  createStopSchema,
  updateStopSchema,
  reorderStopsSchema,
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
  dateRangeQuerySchema,
} from '../validators/itinerary.validator';

/**
 * GET /api/trips/:id/itinerary
 */
export const getItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;

    const itinerary = await itineraryService.getItinerary(tripId, userId);

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:id/calendar
 */
export const getCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const query = dateRangeQuerySchema.parse(req.query);

    const calendar = await itineraryService.getCalendar(tripId, userId, query);

    res.json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:id/timeline
 */
export const getTimeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const query = dateRangeQuerySchema.parse(req.query);

    const timeline = await itineraryService.getTimeline(tripId, userId, query);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/trips/:id/stops
 */
export const createStop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const validated = createStopSchema.parse(req.body);

    const stop = await itineraryService.createStop(tripId, userId, validated);

    res.status(201).json({
      success: true,
      data: { stop },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:id/stops/:stopId
 */
export const updateStop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const stopId = req.params.stopId as string;
    const validated = updateStopSchema.parse(req.body);

    const stop = await itineraryService.updateStop(tripId, stopId, userId, validated);

    res.json({
      success: true,
      data: { stop },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:id/stops/:stopId
 */
export const deleteStop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const stopId = req.params.stopId as string;

    await itineraryService.deleteStop(tripId, stopId, userId);

    res.json({
      success: true,
      data: { message: 'Trip stop deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:id/stops/reorder
 */
export const reorderStops = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const validated = reorderStopsSchema.parse(req.body);

    const stops = await itineraryService.reorderStops(tripId, userId, validated.stopIds);

    res.json({
      success: true,
      data: { stops },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/trips/:id/stops/:stopId/sections
 */
export const createSection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const stopId = req.params.stopId as string;
    const validated = createSectionSchema.parse(req.body);

    const section = await itineraryService.createSection(tripId, stopId, userId, validated);

    res.status(201).json({
      success: true,
      data: { section },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:id/stops/:stopId/sections/:sectionId
 */
export const updateSection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const stopId = req.params.stopId as string;
    const sectionId = req.params.sectionId as string;
    const validated = updateSectionSchema.parse(req.body);

    const section = await itineraryService.updateSection(
      tripId,
      stopId,
      sectionId,
      userId,
      validated
    );

    res.json({
      success: true,
      data: { section },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:id/stops/:stopId/sections/:sectionId
 */
export const deleteSection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const stopId = req.params.stopId as string;
    const sectionId = req.params.sectionId as string;

    await itineraryService.deleteSection(tripId, stopId, sectionId, userId);

    res.json({
      success: true,
      data: { message: 'Itinerary section deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:id/stops/:stopId/sections/reorder
 */
export const reorderSections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.id as string;
    const stopId = req.params.stopId as string;
    const validated = reorderSectionsSchema.parse(req.body);

    const sections = await itineraryService.reorderSections(
      tripId,
      stopId,
      userId,
      validated.sectionIds
    );

    res.json({
      success: true,
      data: { sections },
    });
  } catch (error) {
    next(error);
  }
};
