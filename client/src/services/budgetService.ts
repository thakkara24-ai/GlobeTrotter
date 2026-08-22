import api from './api';
import { BudgetBreakdown } from '../types';

export const budgetService = {
  async getTripBudget(tripId: string): Promise<BudgetBreakdown> {
    const res = await api.get<{ success: boolean; data: BudgetBreakdown }>(`/budget/${tripId}`);
    return res.data.data;
  },

  async applyRecommendation(
    tripId: string,
    data: {
      action: 'SUBSTITUTE' | 'REMOVE';
      targetItemId: string;
      suggestedItemId?: string;
    }
  ): Promise<BudgetBreakdown> {
    const res = await api.post<{ success: boolean; data: BudgetBreakdown }>(
      `/budget/${tripId}/apply-recommendation`,
      data
    );
    return res.data.data;
  },
};
