import api from './api';
import { TripStop, ItinerarySection } from '../types';

export const itineraryService = {
  async addStop(tripId: string, data: { cityId: string; startDate: string; endDate: string; order?: number }): Promise<TripStop> {
    const res = await api.post<{ success: boolean; data: { stop: TripStop } }>(`/itinerary/${tripId}/stops`, data);
    return res.data.data.stop;
  },

  async updateStop(tripId: string, stopId: string, data: Partial<TripStop>): Promise<TripStop> {
    const res = await api.put<{ success: boolean; data: { stop: TripStop } }>(`/itinerary/${tripId}/stops/${stopId}`, data);
    return res.data.data.stop;
  },

  async deleteStop(tripId: string, stopId: string): Promise<void> {
    await api.delete(`/itinerary/${tripId}/stops/${stopId}`);
  },

  async addSection(
    tripId: string,
    data: {
      stopId?: string;
      type: string;
      title: string;
      description?: string;
      date: string;
      startTime?: string;
      endTime?: string;
      estimatedCost: number;
      activityId?: string;
      order?: number;
    }
  ): Promise<ItinerarySection> {
    const res = await api.post<{ success: boolean; data: { section: ItinerarySection } }>(`/itinerary/${tripId}/sections`, data);
    return res.data.data.section;
  },

  async updateSection(tripId: string, sectionId: string, data: Partial<ItinerarySection>): Promise<ItinerarySection> {
    const res = await api.put<{ success: boolean; data: { section: ItinerarySection } }>(
      `/itinerary/${tripId}/sections/${sectionId}`,
      data
    );
    return res.data.data.section;
  },

  async deleteSection(tripId: string, sectionId: string): Promise<void> {
    await api.delete(`/itinerary/${tripId}/sections/${sectionId}`);
  },
};
