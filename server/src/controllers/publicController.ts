import { Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { TripStop } from '../models/TripStop';
import { ItinerarySection } from '../models/ItinerarySection';
import { calculateTripBudget } from '../services/budgetService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';

export const getSharedTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareToken } = req.params;

    const trip = await Trip.findOne({ shareToken, isPublic: true }).populate('userId', 'name avatar');
    if (!trip) {
      sendError(res, 'Trip not found or it has been set to private', 404);
      return;
    }

    const stops = await TripStop.find({ tripId: trip._id }).populate('cityId').sort({ order: 1 });
    const sections = await ItinerarySection.find({ tripId: trip._id }).populate('activityId').sort({ date: 1, order: 1 });
    const budget = await calculateTripBudget(trip._id);

    sendSuccess(res, {
      trip,
      stops,
      sections,
      budget,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch shared trip', 500);
  }
};

export const cloneSharedTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { shareToken } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, 'You must be logged in to clone this trip', 401);
      return;
    }

    const originalTrip = await Trip.findOne({ shareToken, isPublic: true });
    if (!originalTrip) {
      sendError(res, 'Trip not found or is not public', 404);
      return;
    }

    // Clone Trip
    const newTrip = await Trip.create({
      userId,
      title: `${originalTrip.title} (Clone)`,
      description: originalTrip.description,
      startDate: originalTrip.startDate,
      endDate: originalTrip.endDate,
      budget: originalTrip.budget,
      coverImage: originalTrip.coverImage,
      isPublic: false,
      shareToken: crypto.randomBytes(16).toString('hex'),
      status: 'PLANNING',
    });

    // Clone Stops
    const stops = await TripStop.find({ tripId: originalTrip._id });
    const stopIdMap: Record<string, string> = {};

    for (const stop of stops) {
      const clonedStop = await TripStop.create({
        tripId: newTrip._id,
        cityId: stop.cityId,
        startDate: stop.startDate,
        endDate: stop.endDate,
        order: stop.order,
      });
      stopIdMap[stop._id.toString()] = clonedStop._id.toString();
    }

    // Clone Sections
    const sections = await ItinerarySection.find({ tripId: originalTrip._id });
    for (const sec of sections) {
      await ItinerarySection.create({
        tripId: newTrip._id,
        stopId: sec.stopId ? stopIdMap[sec.stopId.toString()] : undefined,
        type: sec.type,
        title: sec.title,
        description: sec.description,
        date: sec.date,
        startTime: sec.startTime,
        endTime: sec.endTime,
        estimatedCost: sec.estimatedCost,
        activityId: sec.activityId,
        order: sec.order,
      });
    }

    sendSuccess(res, { trip: newTrip }, 'Trip cloned successfully into your account', 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to clone trip', 500);
  }
};
