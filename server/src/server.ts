import { createApp } from './app';
import { connectDB } from './config/db';
import { config } from './config/env';
import { City } from './models/City';
import { seedDatabase } from './seed/seed';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Auto-seed if database is completely empty (first time run or in-memory)
    const cityCount = await City.countDocuments();
    if (cityCount === 0) {
      console.log('[Server] Database is empty. Running initial automatic seed...');
      await seedDatabase();
    }

    // 3. Start Express server
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`🚀 GlobeTrotter Backend Server running on http://localhost:${config.port}`);
      console.log(`📡 API Endpoints available at http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
