import api from './api';
import { City, Activity } from '../types';

export const cityService = {
  async getCities(params?: {
    search?: string;
    country?: string;
    region?: string;
    costIndex?: string;
    sort?: string;
  }): Promise<{ cities: City[]; meta: { total: number; countries: string[]; regions: string[] } }> {
    const res = await api.get<{
      success: boolean;
      data: { cities: City[]; meta: { total: number; countries: string[]; regions: string[] } };
    }>('/cities', { params });
    return res.data.data;
  },

  async getCityById(id: string): Promise<{ city: City; activities: Activity[] }> {
    const res = await api.get<{ success: boolean; data: { city: City; activities: Activity[] } }>(`/cities/${id}`);
    return res.data.data;
  },
};
