import mongoose from 'mongoose';
import User, { IUser, IUserPublic, IUserSafe } from '../models/User';
import { UpdateProfileInput } from '../validators/profile.validator';

class ProfileService {
  /**
   * GET /api/profile
   * Returns current authenticated user profile.
   */
  async getProfile(userId: string): Promise<IUserSafe> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return user.toSafeObject();
  }

  /**
   * PUT /api/profile
   * Updates authenticated user profile.
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<IUserSafe> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Check username uniqueness if changing
    if (data.username && data.username.toLowerCase() !== user.username) {
      const normalizedUsername = data.username.toLowerCase();
      const existing = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id },
      });

      if (existing) {
        const error = new Error('Username is already taken');
        (error as any).statusCode = 409;
        throw error;
      }

      user.username = normalizedUsername;
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.avatar !== undefined) user.avatar = data.avatar || undefined;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.location !== undefined) user.location = data.location;
    if (data.country !== undefined) user.country = data.country;
    if (data.travelInterests !== undefined) user.travelInterests = data.travelInterests;
    if (data.preferredTravelStyle !== undefined)
      user.preferredTravelStyle = data.preferredTravelStyle;
    if (data.languagePreference !== undefined)
      user.languagePreference = data.languagePreference;

    await user.save();
    return user.toSafeObject();
  }

  /**
   * GET /api/users/:username
   * Retrieves public read-only user profile.
   */
  async getPublicProfile(username: string): Promise<IUserPublic> {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      const error = new Error('Username is required');
      (error as any).statusCode = 400;
      throw error;
    }

    const normalized = username.trim().toLowerCase();
    const user = await User.findOne({ username: normalized });

    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return user.toPublicProfile();
  }
}

export default new ProfileService();
