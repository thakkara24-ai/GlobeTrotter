import { Request, Response, NextFunction } from 'express';
import locationService from '../services/location.service';
import {
  updateLocationSchema,
  nearbyQuerySchema,
  distanceQuerySchema,
} from '../validators/location.validator';

/**
 * GET /api/location/distance
 */
export const getDistance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = distanceQuerySchema.parse(req.query);

    const result = locationService.getDistance(
      query.fromLatitude,
      query.fromLongitude,
      query.toLatitude,
      query.toLongitude
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cities/nearby
 */
export const getNearbyCities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = nearbyQuerySchema.parse(req.query);

    const result = await locationService.findNearbyCities(
      query.latitude,
      query.longitude,
      query.radius,
      query.page,
      query.limit
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/activities/nearby
 */
export const getNearbyActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = nearbyQuerySchema.parse(req.query);

    const result = await locationService.findNearbyActivities(
      query.latitude,
      query.longitude,
      query.radius,
      query.page,
      query.limit
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/cities/:id/location
 */
export const updateCityLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cityId = req.params.id as string;
    const body = updateLocationSchema.parse(req.body);

    const city = await locationService.updateCityLocation(
      cityId,
      body.latitude,
      body.longitude
    );

    res.json({
      success: true,
      data: { city },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/activities/:id/location
 */
export const updateActivityLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activityId = req.params.id as string;
    const body = updateLocationSchema.parse(req.body);

    const activity = await locationService.updateActivityLocation(
      activityId,
      body.latitude,
      body.longitude
    );

    res.json({
      success: true,
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:id/map
 */
export const getTripMap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.id as string;
    const userId = req.user!._id.toString();

    const mapData = await locationService.getTripMapData(tripId, userId);

    res.json({
      success: true,
      data: mapData,
    });
  } catch (error) {
    next(error);
  }
};
