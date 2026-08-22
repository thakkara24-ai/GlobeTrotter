import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';

let initialized = false;
let initPromise: Promise<void> | null = null;

const initialize = async (): Promise<void> => {
  if (initialized) return;

  if (!initPromise) {
    initPromise = connectDB().then(() => {
      initialized = true;
    });
  }

  await initPromise;
};

const app = createApp();

export default async function handler(req: any, res: any) {
  await initialize();
  return app(req, res);
}
