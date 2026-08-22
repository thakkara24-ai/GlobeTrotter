import { Request, Response } from 'express';
import { Activity } from '../models/Activity';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, cityId, maxCost, sort } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
      ];
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (cityId) {
      query.cityId = cityId;
    }
    if (maxCost) {
      query.cost = { $lte: Number(maxCost) };
    }

    let sortOption: any = { popularity: -1 };
    if (sort === 'cost_asc') sortOption = { cost: 1 };
    if (sort === 'cost_desc') sortOption = { cost: -1 };
    if (sort === 'popularity') sortOption = { popularity: -1 };
    if (sort === 'duration') sortOption = { duration: 1 };

    const activities = await Activity.find(query).populate('cityId', 'name country image').sort(sortOption);

    sendSuccess(res, { activities, total: activities.length });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch activities', 500);
  }
};

export const getActivityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id).populate('cityId');
    if (!activity) {
      sendError(res, 'Activity not found', 404);
      return;
    }

    sendSuccess(res, { activity });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch activity', 500);
  }
};
