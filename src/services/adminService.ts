import api from './api';

export interface AdminSummary {
  totalUsers: number;
  totalTrips: number;
  totalCities: number;
  totalActivities: number;
  totalPosts: number;
}

export interface TopCity {
  _id: string;
  name: string;
  country: string;
  popularity: number;
  image: string;
}

export interface TopActivity {
  _id: string;
  name: string;
  category: string;
  cost: number;
  popularity: number;
  cityId: { _id: string; name: string } | null;
}

export interface TripStatusCount {
  _id: string;
  count: number;
}

export interface AdminStatsResponse {
  summary: AdminSummary;
  topCities: TopCity[];
  topActivities: TopActivity[];
  tripStatusCounts: TripStatusCount[];
}

export const adminService = {
  async getStats(): Promise<AdminStatsResponse> {
    const res = await api.get<{ success: boolean; data: AdminStatsResponse }>('/admin/stats');
    return res.data.data;
  },
};
