import api from './api';
import { Activity } from '../types';

export const activityService = {
  async getActivities(params?: {
    search?: string;
    category?: string;
    cityId?: string;
    maxCost?: number;
    sort?: string;
  }): Promise<{ activities: Activity[]; total: number }> {
    const res = await api.get<{ success: boolean; data: { activities: Activity[]; total: number } }>('/activities', {
      params,
    });
    return res.data.data;
  },

  async getActivityById(id: string): Promise<Activity> {
    const res = await api.get<{ success: boolean; data: { activity: Activity } }>(`/activities/${id}`);
    return res.data.data.activity;
  },
};
