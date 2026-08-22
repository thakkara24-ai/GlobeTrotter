import Activity, { IActivity } from '../models/Activity';
import { PaginatedResult } from './city.service';

class ActivityService {
  /**
   * List activities with optional city, category, search, and pagination.
   */
  async listActivities(params: {
    city?: string;
    category?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResult<IActivity>> {
    const filter: Record<string, any> = { isActive: true };

    if (params.city) {
      filter.city = params.city;
    }

    if (params.category) {
      filter.category = params.category;
    }

    if (params.search) {
      filter.$text = { $search: params.search };
    }

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      Activity.find(filter)
        .populate('city', 'name country countryCode')
        .sort({ name: 1 })
        .skip(skip)
        .limit(params.limit),
      Activity.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    };
  }

  /**
   * Get an activity by ID.
   */
  async getActivityById(id: string): Promise<IActivity> {
    const activity = await Activity.findById(id).populate(
      'city',
      'name country countryCode'
    );
    if (!activity) {
      const error = new Error('Activity not found');
      (error as any).statusCode = 404;
      throw error;
    }
    return activity;
  }
}

export default new ActivityService();
