import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Trip } from '../models/Trip';
import { TripStop } from '../models/TripStop';
import { ItinerarySection } from '../models/ItinerarySection';
import { City } from '../models/City';
import { sendSuccess, sendError } from '../utils/apiResponse';
import crypto from 'crypto';

export const createTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { title, description, startDate, endDate, budget, coverImage, isPublic, status } = req.body;

    const trip = await Trip.create({
      userId,
      title,
      description,
      startDate,
      endDate,
      budget: budget || 0,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      isPublic: !!isPublic,
      shareToken: crypto.randomBytes(16).toString('hex'),
      status: status || 'PLANNING',
    });

    sendSuccess(res, { trip }, 'Trip created successfully', 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create trip', 500);
  }
};

export const getTrips = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { search, status, sort } = req.query;

    const query: any = { userId };
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      query.title = { $regex: search as string, $options: 'i' };
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'date_asc') sortOption = { startDate: 1 };
    if (sort === 'date_desc') sortOption = { startDate: -1 };
    if (sort === 'budget_high') sortOption = { budget: -1 };
    if (sort === 'budget_low') sortOption = { budget: 1 };

    const trips = await Trip.find(query).sort(sortOption);

    // Enrich each trip with stops count, city names, and estimated spent
    const enrichedTrips = await Promise.all(
      trips.map(async (trip) => {
        const stops = await TripStop.find({ tripId: trip._id }).populate('cityId', 'name country image');
        const sections = await ItinerarySection.find({ tripId: trip._id }).select('estimatedCost');
        const estimatedTotal = sections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

        return {
          ...trip.toJSON(),
          stopsCount: stops.length,
          stops,
          estimatedTotal,
          isOverBudget: estimatedTotal > trip.budget,
        };
      })
    );

    sendSuccess(res, { trips: enrichedTrips });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch trips', 500);
  }
};

export const getTripById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: id, userId });
    if (!trip) {
      sendError(res, 'Trip not found or you do not have permission to view it', 404);
      return;
    }

    const stops = await TripStop.find({ tripId: id }).populate('cityId').sort({ order: 1 });
    const sections = await ItinerarySection.find({ tripId: id }).populate('activityId').sort({ date: 1, order: 1 });

    sendSuccess(res, {
      trip,
      stops,
      sections,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch trip', 500);
  }
};

export const updateTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: id, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const updates = req.body;
    Object.assign(trip, updates);
    await trip.save();

    sendSuccess(res, { trip }, 'Trip updated successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update trip', 500);
  }
};

export const deleteTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOneAndDelete({ _id: id, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    // Cascade delete associated stops and itinerary sections
    await TripStop.deleteMany({ tripId: id });
    await ItinerarySection.deleteMany({ tripId: id });

    sendSuccess(res, null, 'Trip deleted successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete trip', 500);
  }
};

export const toggleShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: id, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    trip.isPublic = !trip.isPublic;
    if (!trip.shareToken) {
      trip.shareToken = crypto.randomBytes(16).toString('hex');
    }
    await trip.save();

    sendSuccess(
      res,
      {
        isPublic: trip.isPublic,
        shareToken: trip.shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/shared/${trip.shareToken}`,
      },
      trip.isPublic ? 'Trip is now public' : 'Trip is now private'
    );
  } catch (err: any) {
    sendError(res, err.message || 'Failed to toggle sharing', 500);
  }
};
