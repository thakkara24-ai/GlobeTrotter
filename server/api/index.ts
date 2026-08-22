import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';

const app = createApp();

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

export default async function handler(req: any, res: any) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader(
      'Access-Control-Allow-Origin',
      'https://globe-trotter-xnuz.vercel.app'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  await initialize();

  return app(req, res);
}
