import { Request, Response, NextFunction } from 'express';
import shareService from '../services/share.service';

/**
 * POST /api/trips/:tripId/share/public
 */
export const enablePublicShare = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const ownerId = req.user!._id.toString();

    const result = await shareService.enablePublicShare(tripId, ownerId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:tripId/share/public
 */
export const disablePublicShare = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;
    const ownerId = req.user!._id.toString();

    await shareService.disablePublicShare(tripId, ownerId);

    res.json({
      success: true,
      data: { message: 'Public share link revoked successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/public/trips/:shareToken (Public - No Auth)
 */
export const getPublicItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shareToken = req.params.shareToken as string;

    const itinerary = await shareService.getPublicItinerary(shareToken);

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    next(error);
  }
};
