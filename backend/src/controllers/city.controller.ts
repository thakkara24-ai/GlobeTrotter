import { Request, Response, NextFunction } from 'express';
import { cityQuerySchema } from '../validators/city.validator';
import cityService from '../services/city.service';

/**
 * GET /api/cities
 */
export const listCities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = cityQuerySchema.parse(req.query);
    const result = await cityService.listCities(query);

    res.json({
      success: true,
      data: {
        cities: result.items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cities/:id
 */
export const getCityById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const city = await cityService.getCityById(req.params.id as string);

    res.json({
      success: true,
      data: { city },
    });
  } catch (error) {
    next(error);
  }
};
