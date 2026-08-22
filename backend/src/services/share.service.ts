import crypto from 'crypto';
import mongoose from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import TripStop from '../models/TripStop';
import ItinerarySection from '../models/ItinerarySection';
import collaboratorService from './collaborator.service';

export interface PublicItineraryResponse {
  trip: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    coverImage?: string;
    status: string;
  };
  stops: Array<{
    _id: string;
    startDate: Date;
    endDate: Date;
    order: number;
    notes?: string;
    city: {
      _id: string;
      name: string;
      country: string;
      countryCode: string;
      description: string;
      image?: string;
      latitude?: number;
      longitude?: number;
      timezone?: string;
    } | null;
    sections: Array<{
      _id: string;
      title: string;
      type: string;
      date: string;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      estimatedCost?: number;
      currency?: string;
      notes?: string;
      order: number;
      activity: {
        _id: string;
        name: string;
        description: string;
        category: string;
        estimatedCost?: number;
        currency?: string;
        durationMinutes?: number;
        image?: string;
        latitude?: number;
        longitude?: number;
      } | null;
    }>;
  }>;
}

class ShareService {
  /**
   * POST /api/trips/:tripId/share/public
   * Enable public sharing and generate a unique token (Owner only).
   */
  async enablePublicShare(
    tripId: string,
    ownerId: string
  ): Promise<{ enabled: boolean; shareToken: string; shareUrl: string }> {
    const { trip } = await collaboratorService.requireTripAccess(
      tripId,
      ownerId,
      'OWNER'
    );

    if (!trip.publicShareToken) {
      trip.publicShareToken = crypto.randomBytes(24).toString('hex');
    }

    trip.publicShareEnabled = true;
    await trip.save();

    return {
      enabled: true,
      shareToken: trip.publicShareToken,
      shareUrl: `/api/public/trips/${trip.publicShareToken}`,
    };
  }

  /**
   * DELETE /api/trips/:tripId/share/public
   * Disable public sharing and revoke the token (Owner only).
   */
  async disablePublicShare(tripId: string, ownerId: string): Promise<void> {
    const { trip } = await collaboratorService.requireTripAccess(
      tripId,
      ownerId,
      'OWNER'
    );

    trip.publicShareEnabled = false;
    trip.publicShareToken = null;
    await trip.save();
  }

  /**
   * GET /api/public/trips/:shareToken
   * Retrieve clean public read-only itinerary without exposing private data.
   */
  async getPublicItinerary(
    shareToken: string
  ): Promise<PublicItineraryResponse> {
    if (!shareToken || typeof shareToken !== 'string' || shareToken.trim() === '') {
      const error = new Error(
        'Public trip not found or sharing is disabled'
      );
      (error as any).statusCode = 404;
      throw error;
    }

    const trip = await Trip.findOne({
      publicShareToken: shareToken.trim(),
      publicShareEnabled: true,
    });

    if (!trip) {
      const error = new Error(
        'Public trip not found or sharing is disabled'
      );
      (error as any).statusCode = 404;
      throw error;
    }

    // Fetch stops
    const stops = await TripStop.find({ tripId: trip._id })
      .populate(
        'cityId',
        '_id name country countryCode description image latitude longitude timezone'
      )
      .sort({ order: 1 });

    // Fetch sections
    const sections = await ItinerarySection.find({ tripId: trip._id })
      .populate(
        'activityId',
        '_id name description category estimatedCost currency durationMinutes image latitude longitude'
      )
      .sort({ date: 1, startTime: 1, order: 1 });

    // Format stops & sections
    const formattedStops = stops.map((stop) => {
      const cityObj = stop.cityId as any;
      const stopSections = sections
        .filter((s) => s.stopId.toString() === stop._id.toString())
        .map((s) => {
          const actObj = s.activityId as any;
          return {
            _id: s._id.toString(),
            title: s.title,
            type: s.type,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            durationMinutes: s.durationMinutes,
            estimatedCost: s.estimatedCost,
            currency: s.currency,
            notes: s.notes,
            order: s.order,
            activity: actObj
              ? {
                  _id: actObj._id.toString(),
                  name: actObj.name,
                  description: actObj.description,
                  category: actObj.category,
                  estimatedCost: actObj.estimatedCost,
                  currency: actObj.currency,
                  durationMinutes: actObj.durationMinutes,
                  image: actObj.image,
                  latitude: actObj.latitude,
                  longitude: actObj.longitude,
                }
              : null,
          };
        });

      return {
        _id: stop._id.toString(),
        startDate: stop.startDate,
        endDate: stop.endDate,
        order: stop.order,
        notes: stop.notes,
        city: cityObj
          ? {
              _id: cityObj._id.toString(),
              name: cityObj.name,
              country: cityObj.country,
              countryCode: cityObj.countryCode,
              description: cityObj.description,
              image: cityObj.image,
              latitude: cityObj.latitude,
              longitude: cityObj.longitude,
              timezone: cityObj.timezone,
            }
          : null,
        sections: stopSections,
      };
    });

    return {
      trip: {
        title: trip.title,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverImage: trip.coverImage,
        status: trip.status,
      },
      stops: formattedStops,
    };
  }
}

export default new ShareService();
