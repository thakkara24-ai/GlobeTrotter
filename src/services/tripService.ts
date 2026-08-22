import api from './api';
import { Trip, TripStop, ItinerarySection } from '../types';

export interface TripDetailResponse {
  trip: Trip;
  stops: TripStop[];
  sections: ItinerarySection[];
}

export const tripService = {
  async getTrips(params?: { search?: string; status?: string; sort?: string }): Promise<Trip[]> {
    const res = await api.get<{ success: boolean; data: { trips: Trip[] } }>('/trips', { params });
    return res.data.data.trips;
  },

  async getTripById(id: string): Promise<TripDetailResponse> {
    const res = await api.get<{ success: boolean; data: TripDetailResponse }>(`/trips/${id}`);
    return res.data.data;
  },

  async createTrip(data: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    budget: number;
    coverImage?: string;
    isPublic?: boolean;
    status?: string;
  }): Promise<Trip> {
    const res = await api.post<{ success: boolean; data: { trip: Trip } }>('/trips', data);
    return res.data.data.trip;
  },

  async updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
    const res = await api.put<{ success: boolean; data: { trip: Trip } }>(`/trips/${id}`, data);
    return res.data.data.trip;
  },

  async deleteTrip(id: string): Promise<void> {
    await api.delete(`/trips/${id}`);
  },

  async toggleShare(id: string): Promise<{ isPublic: boolean; shareToken: string; shareUrl: string }> {
    const res = await api.post<{
      success: boolean;
      data: { isPublic: boolean; shareToken: string; shareUrl: string };
    }>(`/trips/${id}/share`);
    return res.data.data;
  },

  async getSharedTrip(shareToken: string): Promise<{
    trip: Trip;
    stops: TripStop[];
    sections: ItinerarySection[];
    budget: any;
  }> {
    const res = await api.get<{ success: boolean; data: any }>(`/public/trips/${shareToken}`);
    return res.data.data;
  },

  async cloneSharedTrip(shareToken: string): Promise<{ trip: Trip }> {
    const res = await api.post<{ success: boolean; data: { trip: Trip } }>(`/public/trips/${shareToken}/clone`);
    return res.data.data;
  },
};
