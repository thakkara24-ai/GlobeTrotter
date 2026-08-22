import mongoose from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import TripStop, { ITripStop } from '../models/TripStop';
import ItinerarySection, { IItinerarySection } from '../models/ItinerarySection';
import City from '../models/City';
import Activity from '../models/Activity';
import {
  CreateStopInput,
  UpdateStopInput,
  CreateSectionInput,
  UpdateSectionInput,
  DateRangeQuery,
} from '../validators/itinerary.validator';

/**
 * Compares whether targetDate falls between startDate and endDate (inclusive, ignoring time component).
 */
export function isDateWithinRange(
  targetDate: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const date = new Date(targetDate);
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dateDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getTime();
  const startDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())).getTime();
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())).getTime();

  return dateDay >= startDay && dateDay <= endDay;
}

/**
 * Formats a populated TripStop document into a clean API response object.
 */
function formatStopObject(stopDoc: any) {
  const obj = typeof stopDoc.toObject === 'function' ? stopDoc.toObject() : stopDoc;
  const { cityId: city, ...rest } = obj;
  return {
    ...rest,
    city: city || null,
  };
}

/**
 * Formats a populated ItinerarySection document into a clean API response object.
 */
function formatSectionObject(sectionDoc: any) {
  const obj = typeof sectionDoc.toObject === 'function' ? sectionDoc.toObject() : sectionDoc;
  const { activityId: activity, ...rest } = obj;
  return {
    ...rest,
    activity: activity || null,
  };
}

class ItineraryService {
  /**
   * Helper: Verifies that a trip exists and belongs to the authenticated user.
   */
  async verifyTripOwnership(tripId: string, userId: string): Promise<ITrip> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      const error = new Error('Invalid trip ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      const error = new Error('Trip not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (trip.user.toString() !== userId) {
      const error = new Error('You do not have permission to access this trip');
      (error as any).statusCode = 403;
      throw error;
    }

    return trip;
  }

  /**
   * Helper: Verifies that a stop exists and belongs to the given trip.
   */
  async verifyStopBelongsToTrip(stopId: string, tripId: string): Promise<ITripStop> {
    if (!mongoose.Types.ObjectId.isValid(stopId)) {
      const error = new Error('Invalid stop ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const stop = await TripStop.findById(stopId);
    if (!stop) {
      const error = new Error('Trip stop not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (stop.tripId.toString() !== tripId) {
      const error = new Error('Stop does not belong to this trip');
      (error as any).statusCode = 400;
      throw error;
    }

    return stop;
  }

  /**
   * GET /api/trips/:id/itinerary
   * Retrieves the full structured itinerary for a trip.
   */
  async getItinerary(tripId: string, userId: string) {
    const trip = await this.verifyTripOwnership(tripId, userId);

    // Fetch ordered stops
    const stops = await TripStop.find({ tripId })
      .populate('cityId', 'name country countryCode description image latitude longitude timezone tags')
      .sort({ order: 1 });

    // Fetch all sections for the trip
    const sections = await ItinerarySection.find({ tripId })
      .populate('activityId', 'name description category estimatedCost currency durationMinutes image tags')
      .sort({ order: 1, date: 1, startTime: 1 });

    // Group sections by stopId
    const sectionsByStop = new Map<string, any[]>();
    for (const section of sections) {
      const stopKey = section.stopId.toString();
      if (!sectionsByStop.has(stopKey)) {
        sectionsByStop.set(stopKey, []);
      }
      sectionsByStop.get(stopKey)!.push(formatSectionObject(section));
    }

    // Format stops with their city and sections
    const formattedStops = stops.map((stop) => {
      const formattedStop = formatStopObject(stop);
      return {
        ...formattedStop,
        sections: sectionsByStop.get(stop._id.toString()) || [],
      };
    });

    return {
      trip: {
        _id: trip._id,
        title: trip.title,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverImage: trip.coverImage,
        status: trip.status,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      },
      stops: formattedStops,
    };
  }

  /**
   * POST /api/trips/:id/stops
   * Creates a new stop for a trip.
   */
  async createStop(tripId: string, userId: string, data: CreateStopInput): Promise<any> {
    await this.verifyTripOwnership(tripId, userId);

    // Verify city exists
    const city = await City.findById(data.cityId);
    if (!city) {
      const error = new Error('City not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Determine order if not supplied
    let order = data.order;
    if (order === undefined) {
      const maxStop = await TripStop.findOne({ tripId }).sort({ order: -1 });
      order = maxStop ? maxStop.order + 1 : 1;
    }

    const stop = await TripStop.create({
      tripId,
      cityId: data.cityId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      order,
    });

    // Synchronize trip cities array
    await Trip.findByIdAndUpdate(tripId, {
      $addToSet: { cities: data.cityId },
    });

    const populated = await TripStop.findById(stop._id).populate(
      'cityId',
      'name country countryCode description image latitude longitude timezone tags'
    );

    return formatStopObject(populated);
  }

  /**
   * PUT /api/trips/:id/stops/:stopId
   * Updates an existing stop.
   */
  async updateStop(
    tripId: string,
    stopId: string,
    userId: string,
    data: UpdateStopInput
  ): Promise<any> {
    await this.verifyTripOwnership(tripId, userId);
    const stop = await this.verifyStopBelongsToTrip(stopId, tripId);

    const updateFields: Record<string, any> = {};

    // Validate new city if changed
    if (data.cityId && data.cityId !== stop.cityId.toString()) {
      const city = await City.findById(data.cityId);
      if (!city) {
        const error = new Error('City not found');
        (error as any).statusCode = 404;
        throw error;
      }

      // Revalidate activities associated with this stop
      const stopSections = await ItinerarySection.find({ stopId, activityId: { $exists: true, $ne: null } });
      for (const sec of stopSections) {
        if (sec.activityId) {
          const act = await Activity.findById(sec.activityId);
          if (act && act.city.toString() !== data.cityId) {
            const error = new Error(
              'Cannot change stop city: existing itinerary sections contain activities from the previous city'
            );
            (error as any).statusCode = 400;
            throw error;
          }
        }
      }

      updateFields.cityId = data.cityId;
    }

    // Validate date changes against existing sections
    const newStartDate = data.startDate ? new Date(data.startDate) : stop.startDate;
    const newEndDate = data.endDate ? new Date(data.endDate) : stop.endDate;

    if (newStartDate > newEndDate) {
      const error = new Error('End date must be on or after start date');
      (error as any).statusCode = 400;
      throw error;
    }

    if (data.startDate || data.endDate) {
      const sections = await ItinerarySection.find({ stopId });
      for (const section of sections) {
        if (!isDateWithinRange(section.date, newStartDate, newEndDate)) {
          const error = new Error(
            'Cannot update stop dates: one or more itinerary sections fall outside the new date range'
          );
          (error as any).statusCode = 400;
          throw error;
        }
      }

      if (data.startDate) updateFields.startDate = newStartDate;
      if (data.endDate) updateFields.endDate = newEndDate;
    }

    if (data.order !== undefined) {
      updateFields.order = data.order;
    }

    const updated = await TripStop.findByIdAndUpdate(stopId, updateFields, {
      new: true,
      runValidators: true,
    }).populate('cityId', 'name country countryCode description image latitude longitude timezone tags');

    // Update trip cities array if city changed
    if (data.cityId && data.cityId !== stop.cityId.toString()) {
      await Trip.findByIdAndUpdate(tripId, { $addToSet: { cities: data.cityId } });
    }

    return formatStopObject(updated);
  }

  /**
   * DELETE /api/trips/:id/stops/:stopId
   * Deletes a stop and cascades to delete all associated itinerary sections.
   */
  async deleteStop(tripId: string, stopId: string, userId: string): Promise<void> {
    await this.verifyTripOwnership(tripId, userId);
    const stop = await this.verifyStopBelongsToTrip(stopId, tripId);

    // Cascade delete associated sections
    await ItinerarySection.deleteMany({ stopId });

    // Delete the stop
    await TripStop.findByIdAndDelete(stopId);

    // Clean up city reference on trip if no other stops use it
    const remainingStopsWithCity = await TripStop.find({ tripId, cityId: stop.cityId });
    if (remainingStopsWithCity.length === 0) {
      await Trip.findByIdAndUpdate(tripId, { $pull: { cities: stop.cityId } });
    }
  }

  /**
   * PUT /api/trips/:id/stops/reorder
   * Reorders stops for a trip sequentially based on provided stop IDs.
   */
  async reorderStops(tripId: string, userId: string, stopIds: string[]): Promise<any[]> {
    await this.verifyTripOwnership(tripId, userId);

    const existingStops = await TripStop.find({ tripId });
    const existingStopIds = new Set(existingStops.map((s) => s._id.toString()));

    if (stopIds.length !== existingStops.length) {
      const error = new Error('The stopIds array must include all stops belonging to this trip');
      (error as any).statusCode = 400;
      throw error;
    }

    for (const id of stopIds) {
      if (!existingStopIds.has(id)) {
        const error = new Error(`Stop with ID ${id} does not belong to this trip`);
        (error as any).statusCode = 400;
        throw error;
      }
    }

    // Update order for each stop
    const updatePromises = stopIds.map((id, index) =>
      TripStop.findByIdAndUpdate(id, { order: index + 1 })
    );
    await Promise.all(updatePromises);

    const reorderedStops = await TripStop.find({ tripId })
      .populate('cityId', 'name country countryCode description image latitude longitude timezone tags')
      .sort({ order: 1 });

    return reorderedStops.map(formatStopObject);
  }

  /**
   * POST /api/trips/:id/stops/:stopId/sections
   * Creates an itinerary section on a stop.
   */
  async createSection(
    tripId: string,
    stopId: string,
    userId: string,
    data: CreateSectionInput
  ): Promise<any> {
    await this.verifyTripOwnership(tripId, userId);
    const stop = await this.verifyStopBelongsToTrip(stopId, tripId);

    // Validate section date is within stop range
    const sectionDate = new Date(data.date);
    if (!isDateWithinRange(sectionDate, stop.startDate, stop.endDate)) {
      const error = new Error('Section date must fall within the stop date range');
      (error as any).statusCode = 400;
      throw error;
    }

    // Validate activity if provided
    if (data.activityId) {
      const activity = await Activity.findById(data.activityId);
      if (!activity) {
        const error = new Error('Activity not found');
        (error as any).statusCode = 404;
        throw error;
      }

      if (activity.city.toString() !== stop.cityId.toString()) {
        const error = new Error('Activity does not belong to the selected stop city');
        (error as any).statusCode = 400;
        throw error;
      }
    }

    // Determine order if not supplied
    let order = data.order;
    if (order === undefined) {
      const maxSection = await ItinerarySection.findOne({ stopId }).sort({ order: -1 });
      order = maxSection ? maxSection.order + 1 : 1;
    }

    const section = await ItinerarySection.create({
      tripId,
      stopId,
      type: data.type,
      title: data.title,
      description: data.description,
      date: sectionDate,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      estimatedCost: data.estimatedCost !== undefined ? data.estimatedCost : 0,
      activityId: data.activityId || undefined,
      order,
    });

    // Synchronize activity reference to trip
    if (data.activityId) {
      await Trip.findByIdAndUpdate(tripId, { $addToSet: { activities: data.activityId } });
    }

    const populated = await ItinerarySection.findById(section._id).populate(
      'activityId',
      'name description category estimatedCost currency durationMinutes image tags'
    );

    return formatSectionObject(populated);
  }

  /**
   * PUT /api/trips/:id/stops/:stopId/sections/:sectionId
   * Updates an existing itinerary section.
   */
  async updateSection(
    tripId: string,
    stopId: string,
    sectionId: string,
    userId: string,
    data: UpdateSectionInput
  ): Promise<any> {
    await this.verifyTripOwnership(tripId, userId);
    const stop = await this.verifyStopBelongsToTrip(stopId, tripId);

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      const error = new Error('Invalid section ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const section = await ItinerarySection.findById(sectionId);
    if (!section) {
      const error = new Error('Itinerary section not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (section.stopId.toString() !== stopId || section.tripId.toString() !== tripId) {
      const error = new Error('Section does not belong to this stop or trip');
      (error as any).statusCode = 400;
      throw error;
    }

    const updateFields: Record<string, any> = {};

    if (data.type !== undefined) updateFields.type = data.type;
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.order !== undefined) updateFields.order = data.order;
    if (data.estimatedCost !== undefined) updateFields.estimatedCost = data.estimatedCost;

    if (data.startTime !== undefined) updateFields.startTime = data.startTime || undefined;
    if (data.endTime !== undefined) updateFields.endTime = data.endTime || undefined;

    // Validate new date
    if (data.date) {
      const newDate = new Date(data.date);
      if (!isDateWithinRange(newDate, stop.startDate, stop.endDate)) {
        const error = new Error('Section date must fall within the stop date range');
        (error as any).statusCode = 400;
        throw error;
      }
      updateFields.date = newDate;
    }

    // Validate activity
    if (data.activityId !== undefined) {
      if (data.activityId) {
        const activity = await Activity.findById(data.activityId);
        if (!activity) {
          const error = new Error('Activity not found');
          (error as any).statusCode = 404;
          throw error;
        }

        if (activity.city.toString() !== stop.cityId.toString()) {
          const error = new Error('Activity does not belong to the selected stop city');
          (error as any).statusCode = 400;
          throw error;
        }
        updateFields.activityId = data.activityId;
        await Trip.findByIdAndUpdate(tripId, { $addToSet: { activities: data.activityId } });
      } else {
        updateFields.activityId = undefined;
      }
    }

    const updated = await ItinerarySection.findByIdAndUpdate(sectionId, updateFields, {
      new: true,
      runValidators: true,
    }).populate('activityId', 'name description category estimatedCost currency durationMinutes image tags');

    return formatSectionObject(updated);
  }

  /**
   * DELETE /api/trips/:id/stops/:stopId/sections/:sectionId
   * Deletes an itinerary section.
   */
  async deleteSection(
    tripId: string,
    stopId: string,
    sectionId: string,
    userId: string
  ): Promise<void> {
    await this.verifyTripOwnership(tripId, userId);
    await this.verifyStopBelongsToTrip(stopId, tripId);

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      const error = new Error('Invalid section ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const section = await ItinerarySection.findById(sectionId);
    if (!section) {
      const error = new Error('Itinerary section not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (section.stopId.toString() !== stopId || section.tripId.toString() !== tripId) {
      const error = new Error('Section does not belong to this stop or trip');
      (error as any).statusCode = 400;
      throw error;
    }

    await ItinerarySection.findByIdAndDelete(sectionId);
  }

  /**
   * PUT /api/trips/:id/stops/:stopId/sections/reorder
   * Reorders sections for a stop sequentially based on provided section IDs.
   */
  async reorderSections(
    tripId: string,
    stopId: string,
    userId: string,
    sectionIds: string[]
  ): Promise<any[]> {
    await this.verifyTripOwnership(tripId, userId);
    await this.verifyStopBelongsToTrip(stopId, tripId);

    const existingSections = await ItinerarySection.find({ stopId });
    const existingSectionIds = new Set(existingSections.map((s) => s._id.toString()));

    if (sectionIds.length !== existingSections.length) {
      const error = new Error('The sectionIds array must include all sections belonging to this stop');
      (error as any).statusCode = 400;
      throw error;
    }

    for (const id of sectionIds) {
      if (!existingSectionIds.has(id)) {
        const error = new Error(`Section with ID ${id} does not belong to this stop`);
        (error as any).statusCode = 400;
        throw error;
      }
    }

    // Update order sequentially
    const updatePromises = sectionIds.map((id, index) =>
      ItinerarySection.findByIdAndUpdate(id, { order: index + 1 })
    );
    await Promise.all(updatePromises);

    const reordered = await ItinerarySection.find({ stopId })
      .populate('activityId', 'name description category estimatedCost currency durationMinutes image tags')
      .sort({ order: 1 });

    return reordered.map(formatSectionObject);
  }

  /**
   * GET /api/trips/:id/calendar
   * Returns itinerary items grouped chronologically by date for a calendar UI.
   */
  async getCalendar(tripId: string, userId: string, query?: DateRangeQuery) {
    const trip = await this.verifyTripOwnership(tripId, userId);

    // Fetch ordered stops
    const stops = await TripStop.find({ tripId })
      .populate('cityId', 'name country countryCode description image latitude longitude timezone tags')
      .sort({ order: 1 });

    const stopMap = new Map<string, any>();
    for (const stop of stops) {
      stopMap.set(stop._id.toString(), formatStopObject(stop));
    }

    // Build section filter
    const sectionFilter: Record<string, any> = { tripId };
    if (query?.startDate || query?.endDate) {
      const dateFilter: Record<string, any> = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.$lte = new Date(query.endDate);
      }
      sectionFilter.date = dateFilter;
    }

    const sections = await ItinerarySection.find(sectionFilter)
      .populate('activityId', 'name description category estimatedCost currency durationMinutes image tags')
      .sort({ date: 1, startTime: 1, order: 1 });

    // Group sections by ISO date string (YYYY-MM-DD)
    const daysMap = new Map<string, any[]>();
    const events: any[] = [];

    for (const section of sections) {
      const formattedSection = formatSectionObject(section);
      const stopObj = stopMap.get(section.stopId.toString());
      const dateStr = new Date(section.date).toISOString().split('T')[0];

      const eventItem = {
        _id: formattedSection._id,
        sectionId: formattedSection._id,
        title: formattedSection.title,
        type: formattedSection.type,
        description: formattedSection.description || '',
        date: dateStr,
        startTime: formattedSection.startTime || null,
        endTime: formattedSection.endTime || null,
        estimatedCost: formattedSection.estimatedCost || 0,
        order: formattedSection.order,
        stop: stopObj
          ? {
              _id: stopObj._id,
              order: stopObj.order,
              startDate: stopObj.startDate,
              endDate: stopObj.endDate,
            }
          : null,
        city: stopObj?.city || null,
        activity: formattedSection.activity || null,
      };

      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, []);
      }
      daysMap.get(dateStr)!.push(eventItem);
      events.push(eventItem);
    }

    const days = Array.from(daysMap.entries()).map(([date, items]) => {
      // Find active stops for this date
      const activeStops = stops
        .filter((s) => isDateWithinRange(date, s.startDate, s.endDate))
        .map((s) => formatStopObject(s));

      return {
        date,
        stops: activeStops,
        items,
      };
    });

    return {
      trip: {
        _id: trip._id,
        title: trip.title,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverImage: trip.coverImage,
        status: trip.status,
      },
      days,
      events,
    };
  }

  /**
   * GET /api/trips/:id/timeline
   * Returns chronological itinerary events combining stops and sections.
   */
  async getTimeline(tripId: string, userId: string, query?: DateRangeQuery) {
    const trip = await this.verifyTripOwnership(tripId, userId);

    // Fetch ordered stops
    const stops = await TripStop.find({ tripId })
      .populate('cityId', 'name country countryCode description image latitude longitude timezone tags')
      .sort({ order: 1 });

    const stopMap = new Map<string, any>();
    for (const stop of stops) {
      stopMap.set(stop._id.toString(), formatStopObject(stop));
    }

    // Build section filter
    const sectionFilter: Record<string, any> = { tripId };
    if (query?.startDate || query?.endDate) {
      const dateFilter: Record<string, any> = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.$lte = new Date(query.endDate);
      }
      sectionFilter.date = dateFilter;
    }

    const sections = await ItinerarySection.find(sectionFilter)
      .populate('activityId', 'name description category estimatedCost currency durationMinutes image tags')
      .sort({ date: 1, startTime: 1, order: 1 });

    const timelineItems: any[] = [];

    // Add Stop milestones
    for (const stop of stops) {
      const formattedStop = formatStopObject(stop);
      const startDateStr = new Date(stop.startDate).toISOString().split('T')[0];

      // Check if stop falls within query date filter
      let includeStop = true;
      if (query?.startDate && startDateStr < query.startDate) {
        includeStop = false;
      }
      if (query?.endDate && startDateStr > query.endDate) {
        includeStop = false;
      }

      if (includeStop) {
        timelineItems.push({
          id: formattedStop._id,
          itemType: 'STOP',
          type: 'STOP',
          date: startDateStr,
          startDate: formattedStop.startDate,
          endDate: formattedStop.endDate,
          startTime: null,
          endTime: null,
          title: `Stay in ${formattedStop.city?.name || 'City'}`,
          description: `Stop ${formattedStop.order}: ${formattedStop.city?.name || 'City'}, ${formattedStop.city?.country || ''}`,
          city: formattedStop.city || null,
          activity: null,
          cost: 0,
          order: formattedStop.order,
          stopId: formattedStop._id,
        });
      }
    }

    // Add Section events
    for (const section of sections) {
      const formattedSection = formatSectionObject(section);
      const stopObj = stopMap.get(section.stopId.toString());
      const dateStr = new Date(section.date).toISOString().split('T')[0];

      timelineItems.push({
        id: formattedSection._id,
        itemType: 'SECTION',
        type: formattedSection.type,
        date: dateStr,
        startTime: formattedSection.startTime || null,
        endTime: formattedSection.endTime || null,
        title: formattedSection.title,
        description: formattedSection.description || '',
        city: stopObj?.city || null,
        activity: formattedSection.activity || null,
        cost: formattedSection.estimatedCost || 0,
        order: formattedSection.order,
        stopId: formattedSection.stopId,
      });
    }

    // Sort timeline chronologically by date, then itemType (STOP first), then startTime / order
    timelineItems.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // If same date, STOP comes before SECTION
      if (a.itemType !== b.itemType) {
        return a.itemType === 'STOP' ? -1 : 1;
      }
      // If both have startTime, sort by startTime
      if (a.startTime && b.startTime) {
        if (a.startTime !== b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
      } else if (a.startTime && !b.startTime) {
        return -1;
      } else if (!a.startTime && b.startTime) {
        return 1;
      }
      // Fallback to order
      return (a.order || 0) - (b.order || 0);
    });

    return {
      trip: {
        _id: trip._id,
        title: trip.title,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverImage: trip.coverImage,
        status: trip.status,
      },
      timeline: timelineItems,
    };
  }
}

export default new ItineraryService();
