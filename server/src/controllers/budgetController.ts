import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Trip } from '../models/Trip';
import { calculateTripBudget } from '../services/budgetService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { ItinerarySection } from '../models/ItinerarySection';
import { Activity } from '../models/Activity';

export const getTripBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    const budgetData = await calculateTripBudget(tripId);
    sendSuccess(res, budgetData);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to calculate budget', 500);
  }
};

export const applyRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const { action, targetItemId, suggestedItemId } = req.body;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      sendError(res, 'Trip not found or unauthorized', 404);
      return;
    }

    if (action === 'SUBSTITUTE' && targetItemId && suggestedItemId) {
      const targetSection = await ItinerarySection.findOne({ _id: targetItemId, tripId });
      const substituteActivity = await Activity.findById(suggestedItemId);
      if (targetSection && substituteActivity) {
        targetSection.title = substituteActivity.name;
        targetSection.description = substituteActivity.description;
        targetSection.estimatedCost = substituteActivity.cost;
        targetSection.activityId = substituteActivity._id;
        await targetSection.save();
      }
    } else if (action === 'REMOVE' && targetItemId) {
      await ItinerarySection.findOneAndDelete({ _id: targetItemId, tripId });
    }

    const updatedBudget = await calculateTripBudget(tripId);
    sendSuccess(res, updatedBudget, 'Recommendation applied successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to apply recommendation', 500);
  }
};
