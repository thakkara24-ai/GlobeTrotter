import Trip, { ITrip } from '../models/Trip';
import { PaginatedResult } from './city.service';
import { CreateTripInput, UpdateTripInput } from '../validators/trip.validator';

class TripService {
  /**
   * Create a new trip for the authenticated user.
   */
  async createTrip(userId: string, data: CreateTripInput): Promise<ITrip> {
    const trip = await Trip.create({
      user: userId,
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      coverImage: data.coverImage,
      cities: data.cities,
      activities: data.activities,
      status: data.status,
    });

    return trip.populate([
      { path: 'cities', select: 'name country countryCode image' },
      { path: 'activities', select: 'name category estimatedCost currency durationMinutes' },
    ]);
  }

  /**
   * List trips for the authenticated user with pagination.
   */
  async getUserTrips(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<ITrip>> {
    const filter = { user: userId };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Trip.find(filter)
        .populate('cities', 'name country countryCode image')
        .populate('activities', 'name category estimatedCost currency')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Trip.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single trip by ID. Verifies ownership.
   */
  async getTripById(tripId: string, userId: string): Promise<ITrip> {
    const trip = await Trip.findById(tripId)
      .populate('cities', 'name country countryCode image description latitude longitude timezone')
      .populate('activities', 'name description category estimatedCost currency durationMinutes image city');

    if (!trip) {
      const error = new Error('Trip not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (trip.user.toString() !== userId) {
      const error = new Error('You do not have permission to access this trip');
      (error as any).statusCode = 403;
      throw error;
    }

    return trip;
  }

  /**
   * Update a trip. Only the owner can update.
   */
  async updateTrip(
    tripId: string,
    userId: string,
    data: UpdateTripInput
  ): Promise<ITrip> {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      const error = new Error('Trip not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (trip.user.toString() !== userId) {
      const error = new Error('You do not have permission to update this trip');
      (error as any).statusCode = 403;
      throw error;
    }

    // Build update object (only provided fields)
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.cities !== undefined) updateData.cities = data.cities;
    if (data.activities !== undefined) updateData.activities = data.activities;
    if (data.status !== undefined) updateData.status = data.status;

    // Cross-validate dates if partially updated
    const finalStartDate = updateData.startDate || trip.startDate;
    const finalEndDate = updateData.endDate || trip.endDate;
    if (finalStartDate > finalEndDate) {
      const error = new Error('End date must be on or after start date');
      (error as any).statusCode = 400;
      throw error;
    }

    const updated = await Trip.findByIdAndUpdate(tripId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('cities', 'name country countryCode image')
      .populate('activities', 'name category estimatedCost currency durationMinutes');

    return updated!;
  }

  /**
   * Delete a trip. Only the owner can delete.
   */
  async deleteTrip(tripId: string, userId: string): Promise<void> {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      const error = new Error('Trip not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (trip.user.toString() !== userId) {
      const error = new Error('You do not have permission to delete this trip');
      (error as any).statusCode = 403;
      throw error;
    }

    await Trip.findByIdAndDelete(tripId);
  }
}

export default new TripService();
