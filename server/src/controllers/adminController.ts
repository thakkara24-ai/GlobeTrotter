import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { City } from '../models/City';
import { Activity } from '../models/Activity';
import { CommunityPost } from '../models/CommunityPost';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getAdminStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTrips = await Trip.countDocuments();
    const totalCities = await City.countDocuments();
    const totalActivities = await Activity.countDocuments();
    const totalPosts = await CommunityPost.countDocuments();

    const topCities = await City.find().sort({ popularity: -1 }).limit(5).select('name country popularity image');
    const topActivities = await Activity.find().sort({ popularity: -1 }).limit(5).populate('cityId', 'name');

    // Aggregate trip statuses
    const tripStatusCounts = await Trip.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    sendSuccess(res, {
      summary: {
        totalUsers,
        totalTrips,
        totalCities,
        totalActivities,
        totalPosts,
      },
      topCities,
      topActivities,
      tripStatusCounts,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch admin stats', 500);
  }
};
