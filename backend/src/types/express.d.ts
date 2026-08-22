import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}
