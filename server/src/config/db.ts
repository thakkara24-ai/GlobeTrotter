import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';

let memServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    // Attempt connection to configured MongoDB URI first
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Successfully connected to MongoDB at ${config.mongoUri}`);
  } catch (err: any) {
    console.warn(`[Database] Failed connecting to ${config.mongoUri}: ${err.message}`);
    console.log('[Database] Starting in-memory MongoDB fallback server...');
    try {
      memServer = await MongoMemoryServer.create();
      const inMemoryUri = memServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] Connected to In-Memory MongoDB at ${inMemoryUri}`);
    } catch (memErr: any) {
      console.error('[Database] Failed to start in-memory MongoDB:', memErr);
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop();
  }
};
