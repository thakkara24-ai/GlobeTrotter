import { Request, Response } from 'express';
import { City } from '../models/City';
import { Activity } from '../models/Activity';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, country, region, costIndex, sort } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { country: { $regex: search as string, $options: 'i' } },
        { region: { $regex: search as string, $options: 'i' } },
      ];
    }
    if (country) {
      query.country = country;
    }
    if (region) {
      query.region = region;
    }
    if (costIndex) {
      query.costIndex = costIndex;
    }

    let sortOption: any = { popularity: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'popularity') sortOption = { popularity: -1 };

    const cities = await City.find(query).sort(sortOption);

    // Get unique countries and regions for filter dropdowns
    const countries = await City.distinct('country');
    const regions = await City.distinct('region');

    sendSuccess(res, {
      cities,
      meta: {
        total: cities.length,
        countries,
        regions,
      },
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch cities', 500);
  }
};

export const getCityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const city = await City.findById(id);
    if (!city) {
      sendError(res, 'City not found', 404);
      return;
    }

    const activities = await Activity.find({ cityId: id }).sort({ popularity: -1 });

    sendSuccess(res, { city, activities });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch city details', 500);
  }
};
