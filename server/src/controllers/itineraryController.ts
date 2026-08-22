import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Trip } from '../models/Trip';
import { TripStop } from '../models/TripStop';
import { ItinerarySection } from '../models/ItinerarySection';
import { Activity } from '../models/Activity';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getTripItinerary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const stops = await TripStop.find({ tripId }).populate('cityId').sort({ order: 1 });
    const sections = await ItinerarySection.find({ tripId }).populate('activityId').sort({ date: 1, order: 1 });

    sendSuccess(res, {
      trip,
      stops,
      sections,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch itinerary', 500);
  }
};

export const addStop = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.id;
    const { cityId, startDate, endDate, order } = req.body;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const stopStart = new Date(startDate);
    const stopEnd = new Date(endDate);
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);

    if (stopStart < tripStart || stopEnd > tripEnd) {
      sendError(
        res,
        `Stop dates (${stopStart.toLocaleDateString()} - ${stopEnd.toLocaleDateString()}) must be within the trip timeframe (${tripStart.toLocaleDateString()} - ${tripEnd.toLocaleDateString()})`,
        400
      );
      return;
    }

    const existingCount = await TripStop.countDocuments({ tripId });
    const newStop = await TripStop.create({
      tripId,
      cityId,
      startDate: stopStart,
      endDate: stopEnd,
      order: order !== undefined ? order : existingCount,
    });

    const populatedStop = await TripStop.findById(newStop._id).populate('cityId');

    sendSuccess(res, { stop: populatedStop }, 'Stop added to trip', 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to add stop', 500);
  }
};

export const updateStop = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tripId, stopId } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const stop = await TripStop.findOne({ _id: stopId, tripId });
    if (!stop) {
      sendError(res, 'Stop not found', 404);
      return;
    }

    const { startDate, endDate, cityId, order } = req.body;
    if (startDate) stop.startDate = new Date(startDate);
    if (endDate) stop.endDate = new Date(endDate);
    if (cityId) stop.cityId = cityId;
    if (order !== undefined) stop.order = order;

    if (stop.endDate < stop.startDate) {
      sendError(res, 'End date cannot be before start date', 400);
      return;
    }

    await stop.save();
    const populated = await TripStop.findById(stop._id).populate('cityId');
    sendSuccess(res, { stop: populated }, 'Stop updated successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update stop', 500);
  }
};

export const deleteStop = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tripId, stopId } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const stop = await TripStop.findOneAndDelete({ _id: stopId, tripId });
    if (!stop) {
      sendError(res, 'Stop not found', 404);
      return;
    }

    // Also remove any sections associated specifically with this stop
    await ItinerarySection.deleteMany({ tripId, stopId });

    sendSuccess(res, null, 'Stop removed from trip');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete stop', 500);
  }
};

export const addSection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.id;
    const { stopId, type, title, description, date, startTime, endTime, estimatedCost, activityId, order } = req.body;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const sectionDate = new Date(date);
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);

    if (sectionDate < tripStart || sectionDate > tripEnd) {
      sendError(
        res,
        `Section date (${sectionDate.toLocaleDateString()}) must be within the overall trip dates (${tripStart.toLocaleDateString()} - ${tripEnd.toLocaleDateString()})`,
        400
      );
      return;
    }

    let resolvedCost = estimatedCost || 0;
    // If activityId is provided, we can fetch its standard cost if not manually overridden
    if (activityId && !estimatedCost) {
      const activity = await Activity.findById(activityId);
      if (activity) resolvedCost = activity.cost;
    }

    const count = await ItinerarySection.countDocuments({ tripId, date: sectionDate });

    const newSection = await ItinerarySection.create({
      tripId,
      stopId: stopId || undefined,
      type: type || 'Activity',
      title,
      description: description || '',
      date: sectionDate,
      startTime: startTime || '09:00',
      endTime: endTime || '',
      estimatedCost: resolvedCost,
      activityId: activityId || undefined,
      order: order !== undefined ? order : count,
    });

    const populatedSection = await ItinerarySection.findById(newSection._id).populate('activityId');

    sendSuccess(res, { section: populatedSection }, 'Itinerary item added', 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to add section', 500);
  }
};

export const updateSection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tripId, sectionId } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const section = await ItinerarySection.findOne({ _id: sectionId, tripId });
    if (!section) {
      sendError(res, 'Itinerary item not found', 404);
      return;
    }

    const updates = req.body;
    if (updates.date) {
      const sectionDate = new Date(updates.date);
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      if (sectionDate < tripStart || sectionDate > tripEnd) {
        sendError(res, 'Date is outside trip bounds', 400);
        return;
      }
      section.date = sectionDate;
    }

    if (updates.type) section.type = updates.type;
    if (updates.title) section.title = updates.title;
    if (updates.description !== undefined) section.description = updates.description;
    if (updates.startTime !== undefined) section.startTime = updates.startTime;
    if (updates.endTime !== undefined) section.endTime = updates.endTime;
    if (updates.estimatedCost !== undefined) section.estimatedCost = updates.estimatedCost;
    if (updates.activityId !== undefined) section.activityId = updates.activityId;
    if (updates.stopId !== undefined) section.stopId = updates.stopId;
    if (updates.order !== undefined) section.order = updates.order;

    await section.save();
    const populated = await ItinerarySection.findById(section._id).populate('activityId');

    sendSuccess(res, { section: populated }, 'Itinerary item updated');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update section', 500);
  }
};

export const deleteSection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tripId, sectionId } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const section = await ItinerarySection.findOneAndDelete({ _id: sectionId, tripId });
    if (!section) {
      sendError(res, 'Itinerary item not found', 404);
      return;
    }

    sendSuccess(res, null, 'Itinerary item deleted');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete section', 500);
  }
};
