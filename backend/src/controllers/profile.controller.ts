import { Request, Response, NextFunction } from 'express';
import profileService from '../services/profile.service';
import { updateProfileSchema } from '../validators/profile.validator';

/**
 * GET /api/profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const profile = await profileService.getProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const validated = updateProfileSchema.parse(req.body);

    const updated = await profileService.updateProfile(userId, validated);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:username
 */
export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const username = req.params.username as string;
    const publicProfile = await profileService.getPublicProfile(username);

    res.json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    next(error);
  }
};
