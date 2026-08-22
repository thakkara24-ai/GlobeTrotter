import { Router, Request, Response } from 'express';
import { getDBStatus } from '../config/database';

const router = Router();

/**
 * GET /api/health
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'GlobeTrotter API is running',
    data: {
      uptime: process.uptime(),
      database: getDBStatus(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
