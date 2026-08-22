import mongoose from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import User from '../models/User';
import TripCollaborator, {
  CollaboratorRole,
  ITripCollaborator,
} from '../models/TripCollaborator';
import { AddCollaboratorInput } from '../validators/collaborator.validator';
import notificationService from './notification.service';
import { NotificationType } from '../models/Notification';

export type EffectiveRole = 'OWNER' | 'EDITOR' | 'VIEWER';

class CollaboratorService {
  /**
   * Helper: Check effective access level of a user on a trip.
   * Returns { trip, role } or throws 404 if trip not found.
   */
  async checkTripAccess(
    tripId: string,
    userId: string
  ): Promise<{ trip: ITrip; role: EffectiveRole | null }> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      const error = new Error('Invalid trip ID format');
      (error as any).statusCode = 400;
      throw error;
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      const error = new Error('Trip not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (trip.user.toString() === userId) {
      return { trip, role: 'OWNER' };
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { trip, role: null };
    }

    const collab = await TripCollaborator.findOne({
      trip: tripId,
      user: userId,
    });

    if (collab) {
      return { trip, role: collab.role as EffectiveRole };
    }

    return { trip, role: null };
  }

  /**
   * Helper: Enforce minimum required role on a trip.
   */
  async requireTripAccess(
    tripId: string,
    userId: string,
    minRole: EffectiveRole
  ): Promise<{ trip: ITrip; role: EffectiveRole }> {
    const { trip, role } = await this.checkTripAccess(tripId, userId);

    if (!role) {
      const error = new Error(
        'You do not have permission to access this trip'
      );
      (error as any).statusCode = 403;
      throw error;
    }

    if (minRole === 'OWNER' && role !== 'OWNER') {
      const error = new Error('Only the trip owner can perform this action');
      (error as any).statusCode = 403;
      throw error;
    }

    if (minRole === 'EDITOR' && role !== 'OWNER' && role !== 'EDITOR') {
      const error = new Error(
        'Editor or owner permissions required for this action'
      );
      (error as any).statusCode = 403;
      throw error;
    }

    return { trip, role };
  }

  /**
   * POST /api/trips/:tripId/collaborators
   * Add a new collaborator to a trip (Owner only).
   */
  async addCollaborator(
    tripId: string,
    ownerId: string,
    data: AddCollaboratorInput
  ): Promise<ITripCollaborator> {
    const { trip } = await this.requireTripAccess(tripId, ownerId, 'OWNER');

    // Find the target user by email or userId
    let targetUser = null;
    if (data.email) {
      targetUser = await User.findOne({ email: data.email.toLowerCase() });
    } else if (data.userId) {
      targetUser = await User.findById(data.userId);
    }

    if (!targetUser) {
      const error = new Error('Target user not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Owner cannot add themselves as collaborator
    if (targetUser._id.toString() === trip.user.toString()) {
      const error = new Error('Trip owner cannot be added as a collaborator');
      (error as any).statusCode = 400;
      throw error;
    }

    // Check if already a collaborator
    const existingCollab = await TripCollaborator.findOne({
      trip: tripId,
      user: targetUser._id,
    });

    if (existingCollab) {
      const error = new Error('User is already a collaborator on this trip');
      (error as any).statusCode = 409;
      throw error;
    }

    const collaborator = new TripCollaborator({
      trip: tripId,
      user: targetUser._id,
      role: data.role || CollaboratorRole.VIEWER,
    });

    await collaborator.save();
    await collaborator.populate('user', '_id name email');

    // Notify added collaborator
    await notificationService.createNotification({
      recipient: targetUser._id,
      actor: ownerId,
      type: NotificationType.COLLABORATOR_ADDED,
      title: 'Added to Trip',
      message: `You were added as a ${collaborator.role} on "${trip.title}"`,
      trip: tripId,
      metadata: { role: collaborator.role },
    });

    return collaborator;
  }

  /**
   * GET /api/trips/:tripId/collaborators
   * List collaborators of a trip (Owner or Collaborators).
   */
  async listCollaborators(
    tripId: string,
    requestingUserId: string
  ): Promise<ITripCollaborator[]> {
    await this.requireTripAccess(tripId, requestingUserId, 'VIEWER');

    const collaborators = await TripCollaborator.find({ trip: tripId })
      .populate('user', '_id name email')
      .sort({ createdAt: 1 });

    return collaborators;
  }

  /**
   * PUT /api/trips/:tripId/collaborators/:collaboratorId
   * Update collaborator role (Owner only).
   */
  async updateCollaboratorRole(
    tripId: string,
    collaboratorId: string,
    ownerId: string,
    newRole: CollaboratorRole
  ): Promise<ITripCollaborator> {
    const { trip } = await this.requireTripAccess(tripId, ownerId, 'OWNER');

    if (!mongoose.Types.ObjectId.isValid(collaboratorId)) {
      const error = new Error('Invalid collaborator ID format');
      (error as any).statusCode = 400;
      throw error;
    }

    const collaborator = await TripCollaborator.findOne({
      _id: collaboratorId,
      trip: tripId,
    });

    if (!collaborator) {
      const error = new Error('Collaborator not found on this trip');
      (error as any).statusCode = 404;
      throw error;
    }

    collaborator.role = newRole;
    await collaborator.save();
    await collaborator.populate('user', '_id name email');

    // Notify collaborator of role update
    const targetUserId = (collaborator.user as any)?._id || collaborator.user;
    await notificationService.createNotification({
      recipient: targetUserId,
      actor: ownerId,
      type: NotificationType.COLLABORATOR_ROLE_UPDATED,
      title: 'Trip Role Updated',
      message: `Your role on "${trip.title}" was updated to ${newRole}`,
      trip: tripId,
      metadata: { newRole },
    });

    return collaborator;
  }

  /**
   * DELETE /api/trips/:tripId/collaborators/:collaboratorId
   * Remove collaborator (Owner only).
   */
  async removeCollaborator(
    tripId: string,
    collaboratorId: string,
    ownerId: string
  ): Promise<void> {
    const { trip } = await this.requireTripAccess(tripId, ownerId, 'OWNER');

    if (!mongoose.Types.ObjectId.isValid(collaboratorId)) {
      const error = new Error('Invalid collaborator ID format');
      (error as any).statusCode = 400;
      throw error;
    }

    const collaborator = await TripCollaborator.findOneAndDelete({
      _id: collaboratorId,
      trip: tripId,
    });

    if (!collaborator) {
      const error = new Error('Collaborator not found on this trip');
      (error as any).statusCode = 404;
      throw error;
    }

    // Notify removed collaborator
    const removedUserId = (collaborator.user as any)?._id || collaborator.user;
    await notificationService.createNotification({
      recipient: removedUserId,
      actor: ownerId,
      type: NotificationType.COLLABORATOR_REMOVED,
      title: 'Removed from Trip',
      message: `You were removed as a collaborator from "${trip.title}"`,
      trip: tripId,
    });
  }
}

export default new CollaboratorService();
