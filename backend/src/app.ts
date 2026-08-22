import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import cityRoutes from './routes/city.routes';
import activityRoutes from './routes/activity.routes';
import tripRoutes from './routes/trip.routes';
import itineraryRoutes from './routes/itinerary.routes';
import expenseRoutes from './routes/expense.routes';
import locationRoutes from './routes/location.routes';
import collaboratorRoutes from './routes/collaborator.routes';
import shareRoutes from './routes/share.routes';
import publicRoutes from './routes/public.routes';

// Middleware
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// --------------- Global Middleware ---------------

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ---------------

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/trips', collaboratorRoutes);
app.use('/api/trips', shareRoutes);
app.use('/api/trips', expenseRoutes);
app.use('/api/trips', itineraryRoutes);
app.use('/api/trips', tripRoutes);

// --------------- Error Handling ---------------

// 404 — must come after all routes
app.use(notFoundHandler);

// Centralized error handler — must be the last middleware
app.use(errorHandler);

export default app;
