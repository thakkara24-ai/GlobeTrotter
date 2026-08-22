import { IUser } from '../models/User';

/**
 * Extend Express Request to include the authenticated user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
