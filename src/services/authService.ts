import api from './api';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async register(data: { name: string; email: string; password: string; confirmPassword: string }): Promise<AuthResponse['data']> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse['data']> {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data.data.user;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await api.put<{ success: boolean; data: { user: User } }>('/users/profile', data);
    return res.data.data.user;
  },

  async toggleSaveDestination(cityId: string): Promise<{ savedDestinations: any[]; isSaved: boolean }> {
    const res = await api.post<{ success: boolean; data: { savedDestinations: any[]; isSaved: boolean } }>(
      `/users/saved-destinations/${cityId}`
    );
    return res.data.data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/account');
  },
};
