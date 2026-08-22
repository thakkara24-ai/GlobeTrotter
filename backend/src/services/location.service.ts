import mongoose from 'mongoose';
import City, { ICity } from '../models/City';
import Activity, { IActivity } from '../models/Activity';
import Trip, { ITrip } from '../models/Trip';
import TripStop from '../models/TripStop';
import ItinerarySection from '../models/ItinerarySection';
import { calculateHaversineDistance } from '../utils/distance';
import collaboratorService from './collaborator.service';

export interface NearbyCityResult {
  city: any;
  distanceMeters: number;
  distanceKilometers: number;
}

export interface NearbyActivityResult {
  activity: any;
  city: any;
  distanceMeters: number;
  distanceKilometers: number;
}

export interface MapMarker {
  id: string;
  type: 'STOP' | 'ACTIVITY';
  title: string;
  order: number;
  stopId?: string;
  coordinates: [number, number] | null; // [longitude, latitude]
  latitude: number | null;
  longitude: number | null;
  city?: any;
  activity?: any;
}

export interface MapRouteSegment {
  fromStop: {
    _id: string;
    order: number;
    cityName: string;
    coordinates: [number, number] | null;
  };
  toStop: {
    _id: string;
    order: number;
    cityName: string;
    coordinates: [number, number] | null;
  };
  distanceMeters: number | null;
  distanceKilometers: number | null;
  calculationType: 'straight-line';
  roadRouteAvailable: boolean;
  status: 'available' | 'unavailable';
}

class LocationService {
  /**
   * Helper: Calculates straight-line distance between two coordinate pairs.
   */
  getDistance(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number
  ) {
    const distance = calculateHaversineDistance(fromLat, fromLon, toLat, toLon);
    return {
      from: { latitude: fromLat, longitude: fromLon },
      to: { latitude: toLat, longitude: toLon },
      distanceMeters: distance.distanceMeters,
      distanceKilometers: distance.distanceKilometers,
      calculationType: 'straight-line' as const,
    };
  }

  /**
   * GET /api/cities/nearby
   * Finds cities near the given coordinates within radiusMeters.
   */
  async findNearbyCities(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ cities: NearbyCityResult[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: { isActive: true },
        },
      },
    ];

    const [countResult, results] = await Promise.all([
      City.aggregate([...pipeline, { $count: 'total' }]),
      City.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    const cities: NearbyCityResult[] = results.map((doc) => {
      const distMeters = Math.round((doc.distanceMeters || 0) * 100) / 100;
      const { distanceMeters, ...cityData } = doc;
      return {
        city: cityData,
        distanceMeters: distMeters,
        distanceKilometers: Math.round((distMeters / 1000) * 100) / 100,
      };
    });

    return {
      cities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/activities/nearby
   * Finds activities near the given coordinates within radiusMeters.
   */
  async findNearbyActivities(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ activities: NearbyActivityResult[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: { isActive: true },
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'city',
        },
      },
      {
        $unwind: {
          path: '$city',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const [countResult, results] = await Promise.all([
      Activity.aggregate([...pipeline, { $count: 'total' }]),
      Activity.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    const activities: NearbyActivityResult[] = results.map((doc) => {
      const distMeters = Math.round((doc.distanceMeters || 0) * 100) / 100;
      const { distanceMeters, city, ...activityData } = doc;
      return {
        activity: activityData,
        city: city || null,
        distanceMeters: distMeters,
        distanceKilometers: Math.round((distMeters / 1000) * 100) / 100,
      };
    });

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * PUT /api/cities/:id/location
   * Updates coordinates for a city.
   */
  async updateCityLocation(
    cityId: string,
    latitude: number,
    longitude: number
  ): Promise<ICity> {
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      const error = new Error('Invalid city ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const city = await City.findByIdAndUpdate(
      cityId,
      {
        $set: {
          latitude,
          longitude,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!city) {
      const error = new Error('City not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return city;
  }

  /**
   * PUT /api/activities/:id/location
   * Updates coordinates for an activity.
   */
  async updateActivityLocation(
    activityId: string,
    latitude: number,
    longitude: number
  ): Promise<IActivity> {
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      const error = new Error('Invalid activity ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        $set: {
          latitude,
          longitude,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('city', 'name country countryCode');

    if (!activity) {
      const error = new Error('Activity not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return activity;
  }

  /**
   * GET /api/trips/:id/map
   * Retrieves map markers and route intelligence for a trip.
   */
  async getTripMapData(tripId: string, userId: string) {
    const { trip } = await collaboratorService.requireTripAccess(
      tripId,
      userId,
      'VIEWER'
    );

    // Fetch ordered stops
    const stops = await TripStop.find({ tripId })
      .populate('cityId', 'name country countryCode latitude longitude location image')
      .sort({ order: 1 });

    // Fetch sections
    const sections = await ItinerarySection.find({ tripId })
      .populate('activityId', 'name description category estimatedCost latitude longitude location image')
      .sort({ date: 1, startTime: 1, order: 1 });

    const markers: MapMarker[] = [];

    // Add Stop markers
    for (const stop of stops) {
      const city = stop.cityId as any;
      const hasCoords =
        city &&
        typeof city.latitude === 'number' &&
        typeof city.longitude === 'number';

      markers.push({
        id: stop._id.toString(),
        type: 'STOP',
        title: city?.name || `Stop ${stop.order}`,
        order: stop.order,
        coordinates: hasCoords ? [city.longitude, city.latitude] : null,
        latitude: hasCoords ? city.latitude : null,
        longitude: hasCoords ? city.longitude : null,
        city: city
          ? {
              _id: city._id,
              name: city.name,
              country: city.country,
            }
          : null,
      });
    }

    // Add Activity markers
    for (const section of sections) {
      const act = section.activityId as any;
      if (act) {
        const hasCoords =
          typeof act.latitude === 'number' && typeof act.longitude === 'number';

        markers.push({
          id: section._id.toString(),
          type: 'ACTIVITY',
          title: section.title,
          order: section.order,
          stopId: section.stopId.toString(),
          coordinates: hasCoords ? [act.longitude, act.latitude] : null,
          latitude: hasCoords ? act.latitude : null,
          longitude: hasCoords ? act.longitude : null,
          activity: {
            _id: act._id,
            name: act.name,
            category: act.category,
          },
        });
      }
    }

    // Calculate route segments between consecutive stops
    const routeSegments: MapRouteSegment[] = [];
    let totalDistanceKilometers = 0;

    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      const currentCity = currentStop.cityId as any;
      const nextCity = nextStop.cityId as any;

      const hasFromCoords =
        currentCity &&
        typeof currentCity.latitude === 'number' &&
        typeof currentCity.longitude === 'number';

      const hasToCoords =
        nextCity &&
        typeof nextCity.latitude === 'number' &&
        typeof nextCity.longitude === 'number';

      if (hasFromCoords && hasToCoords) {
        const distance = calculateHaversineDistance(
          currentCity.latitude,
          currentCity.longitude,
          nextCity.latitude,
          nextCity.longitude
        );

        totalDistanceKilometers += distance.distanceKilometers;

        routeSegments.push({
          fromStop: {
            _id: currentStop._id.toString(),
            order: currentStop.order,
            cityName: currentCity.name,
            coordinates: [currentCity.longitude, currentCity.latitude],
          },
          toStop: {
            _id: nextStop._id.toString(),
            order: nextStop.order,
            cityName: nextCity.name,
            coordinates: [nextCity.longitude, nextCity.latitude],
          },
          distanceMeters: distance.distanceMeters,
          distanceKilometers: distance.distanceKilometers,
          calculationType: 'straight-line',
          roadRouteAvailable: false,
          status: 'available',
        });
      } else {
        routeSegments.push({
          fromStop: {
            _id: currentStop._id.toString(),
            order: currentStop.order,
            cityName: currentCity?.name || 'Unknown',
            coordinates: hasFromCoords
              ? [currentCity.longitude, currentCity.latitude]
              : null,
          },
          toStop: {
            _id: nextStop._id.toString(),
            order: nextStop.order,
            cityName: nextCity?.name || 'Unknown',
            coordinates: hasToCoords
              ? [nextCity.longitude, nextCity.latitude]
              : null,
          },
          distanceMeters: null,
          distanceKilometers: null,
          calculationType: 'straight-line',
          roadRouteAvailable: false,
          status: 'unavailable',
        });
      }
    }

    return {
      trip: {
        _id: trip._id,
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
      },
      markers,
      routeSegments,
      summary: {
        totalStops: stops.length,
        totalActivities: sections.filter((s) => s.activityId).length,
        totalDistanceKilometers:
          Math.round(totalDistanceKilometers * 100) / 100,
      },
    };
  }
}

export default new LocationService();
