import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';

// Route imports
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import tripRoutes from './routes/tripRoutes';
import cityRoutes from './routes/cityRoutes';
import activityRoutes from './routes/activityRoutes';
import itineraryRoutes from './routes/itineraryRoutes';
import budgetRoutes from './routes/budgetRoutes';
import publicRoutes from './routes/publicRoutes';
import communityRoutes from './routes/communityRoutes';
import adminRoutes from './routes/adminRoutes';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: '*', // Allow all origins for dev/demo flexibility
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (!config.isProduction) {
    app.use(morgan('dev'));
  }

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      product: 'GlobeTrotter',
      tagline: 'Plan smarter. Travel better.',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/cities', cityRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/itinerary', itineraryRoutes);
  app.use('/api/budget', budgetRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/community', communityRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
