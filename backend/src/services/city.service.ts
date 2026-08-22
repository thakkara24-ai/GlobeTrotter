import City, { ICity } from '../models/City';

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class CityService {
  /**
   * List cities with optional search, country, tags, and pagination.
   */
  async listCities(params: {
    search?: string;
    country?: string;
    tags?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResult<ICity>> {
    const filter: Record<string, any> = { isActive: true };

    if (params.search) {
      filter.$text = { $search: params.search };
    }

    if (params.country) {
      filter.country = { $regex: new RegExp(params.country, 'i') };
    }

    if (params.tags) {
      const tagList = params.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        filter.tags = { $in: tagList };
      }
    }

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      City.find(filter).sort({ name: 1 }).skip(skip).limit(params.limit),
      City.countDocuments(filter),
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
   * Get a city by ID.
   */
  async getCityById(id: string): Promise<ICity> {
    const city = await City.findById(id);
    if (!city) {
      const error = new Error('City not found');
      (error as any).statusCode = 404;
      throw error;
    }
    return city;
  }
}

export default new CityService();
