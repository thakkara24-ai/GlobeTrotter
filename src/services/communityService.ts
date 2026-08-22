import api from './api';
import { CommunityPost } from '../types';

export const communityService = {
  async getPosts(params?: { search?: string; destination?: string; sort?: string }): Promise<CommunityPost[]> {
    const res = await api.get<{ success: boolean; data: { posts: CommunityPost[] } }>('/community', { params });
    return res.data.data.posts;
  },

  async createPost(data: {
    title: string;
    content: string;
    destination: string;
    images?: string[];
    tags?: string[];
    tripId?: string;
  }): Promise<CommunityPost> {
    const res = await api.post<{ success: boolean; data: { post: CommunityPost } }>('/community', data);
    return res.data.data.post;
  },

  async toggleLike(postId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    const res = await api.post<{ success: boolean; data: { likesCount: number; isLiked: boolean } }>(
      `/community/${postId}/like`
    );
    return res.data.data;
  },
};
