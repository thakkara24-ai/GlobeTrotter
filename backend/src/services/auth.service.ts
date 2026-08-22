import User, { IUser, IUserSafe } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export interface AuthResult {
  user: IUserSafe;
  token: string;
}

class AuthService {
  /**
   * Register a new user.
   */
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> {
    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const error = new Error('A user with this email already exists');
      (error as any).statusCode = 409;
      throw error;
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    // Generate token
    const token = generateToken(user._id.toString());

    // Return safe user (no passwordHash)
    const safeUser = (user as any).toSafeObject() as IUserSafe;

    return { user: safeUser, token };
  }

  /**
   * Authenticate a user with email and password.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user and explicitly select passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );

    if (!user) {
      const error = new Error('Invalid email or password');
      (error as any).statusCode = 401;
      throw error;
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      (error as any).statusCode = 401;
      throw error;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Return safe user (no passwordHash)
    const safeUser = (user as any).toSafeObject() as IUserSafe;

    return { user: safeUser, token };
  }

  /**
   * Get current user by ID.
   */
  async getCurrentUser(userId: string): Promise<IUserSafe> {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return (user as any).toSafeObject() as IUserSafe;
  }
}

export default new AuthService();
