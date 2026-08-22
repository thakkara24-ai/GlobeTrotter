import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { TripStop } from '../models/TripStop';
import { ItinerarySection } from '../models/ItinerarySection';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar, languagePreference } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (languagePreference) user.languagePreference = languagePreference;

    await user.save();
    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update profile', 500);
  }
};

export const toggleSaveDestination = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cityId } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const index = user.savedDestinations.findIndex((d) => d.toString() === cityId);
    let isSaved = false;
    if (index > -1) {
      user.savedDestinations.splice(index, 1);
      isSaved = false;
    } else {
      user.savedDestinations.push(cityId as any);
      isSaved = true;
    }

    await user.save();
    sendSuccess(res, { savedDestinations: user.savedDestinations, isSaved }, isSaved ? 'Saved destination' : 'Removed destination');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update saved destinations', 500);
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    // Cascade delete trips and stops and sections
    const trips = await Trip.find({ userId });
    for (const trip of trips) {
      await TripStop.deleteMany({ tripId: trip._id });
      await ItinerarySection.deleteMany({ tripId: trip._id });
    }
    await Trip.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    sendSuccess(res, null, 'Account and all associated trips deleted successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete account', 500);
  }
};
