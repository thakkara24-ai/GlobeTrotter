import { IItinerarySection, ITrip, BudgetBreakdown } from '../types';
import { Activity } from '../models/Activity';

export interface RecommendationItem {
  type: 'WARNING' | 'TIP' | 'SUBSTITUTION' | 'TRIM';
  title: string;
  description: string;
  savingsAmount?: number;
  targetItemId?: string;
  suggestedItemId?: string;
}

export const generateBudgetRecommendations = async (
  trip: ITrip,
  sections: IItinerarySection[],
  estimatedTotal: number,
  overBudgetAmount: number
): Promise<RecommendationItem[]> => {
  const recommendations: RecommendationItem[] = [];

  if (estimatedTotal === 0) {
    recommendations.push({
      type: 'TIP',
      title: 'Itinerary is empty',
      description: 'Start adding transport, stays, and activities to see real-time budget forecasting and smart tips.',
    });
    return recommendations;
  }

  // 1. If OVER BUDGET
  if (overBudgetAmount > 0) {
    recommendations.push({
      type: 'WARNING',
      title: `Over Budget by ₹${overBudgetAmount.toLocaleString('en-IN')}`,
      description: `Your planned expenses (₹${estimatedTotal.toLocaleString('en-IN')}) exceed your set budget of ₹${trip.budget.toLocaleString('en-IN')}. Review the suggestions below to re-balance.`,
    });

    // Find the most expensive activities/sections
    const sortedExpensive = [...sections].sort((a, b) => b.estimatedCost - a.estimatedCost);
    const topExpensive = sortedExpensive[0];

    if (topExpensive && topExpensive.estimatedCost > 0) {
      // Check if top item is an activity with possible cheaper alternatives
      if (topExpensive.activityId) {
        const currentActivity = await Activity.findById(topExpensive.activityId);
        if (currentActivity) {
          // Find cheaper activity in the same city or category
          const cheaperAlt = await Activity.findOne({
            _id: { $ne: currentActivity._id },
            cityId: currentActivity.cityId,
            cost: { $lt: currentActivity.cost },
          }).sort({ popularity: -1, cost: 1 });

          if (cheaperAlt) {
            const savings = currentActivity.cost - cheaperAlt.cost;
            recommendations.push({
              type: 'SUBSTITUTION',
              title: `Substitute "${currentActivity.name}"`,
              description: `Switch "${currentActivity.name}" (₹${currentActivity.cost.toLocaleString('en-IN')}) to "${cheaperAlt.name}" (₹${cheaperAlt.cost.toLocaleString('en-IN')}) in ${currentActivity.category} to save ₹${savings.toLocaleString('en-IN')}.`,
              savingsAmount: savings,
              targetItemId: topExpensive._id.toString(),
              suggestedItemId: cheaperAlt._id.toString(),
            });
          }
        }
      }

      // Suggest trimming or adjusting the highest cost item
      recommendations.push({
        type: 'TRIM',
        title: `Optimize highest single expense: "${topExpensive.title}"`,
        description: `This single item accounts for ₹${topExpensive.estimatedCost.toLocaleString('en-IN')} (${Math.round((topExpensive.estimatedCost / estimatedTotal) * 100)}% of total trip cost). Modifying or finding a budget tier could save up to ₹${Math.min(topExpensive.estimatedCost, overBudgetAmount).toLocaleString('en-IN')}.`,
        savingsAmount: Math.min(topExpensive.estimatedCost, overBudgetAmount),
        targetItemId: topExpensive._id.toString(),
      });
    }

    // Identify most expensive day
    const dayTotals: Record<string, number> = {};
    sections.forEach((s) => {
      const d = s.date.toISOString().split('T')[0];
      dayTotals[d] = (dayTotals[d] || 0) + s.estimatedCost;
    });

    const maxDayEntry = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    if (maxDayEntry && maxDayEntry[1] > 0) {
      recommendations.push({
        type: 'TIP',
        title: `Peak spending on ${new Date(maxDayEntry[0]).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
        description: `You are spending ₹${maxDayEntry[1].toLocaleString('en-IN')} on this day alone. Distributing activities across other days can help balance your daily burn.`,
      });
    }
  } else {
    // WITHIN BUDGET
    const remaining = trip.budget - estimatedTotal;
    const utilization = trip.budget > 0 ? (estimatedTotal / trip.budget) * 100 : 0;

    if (utilization > 85) {
      recommendations.push({
        type: 'TIP',
        title: 'Approaching Budget Limit',
        description: `You have utilized ${Math.round(utilization)}% of your budget. Remaining safety buffer: ₹${remaining.toLocaleString('en-IN')}. Keep remaining days light on high-cost entertainment.`,
      });
    } else {
      recommendations.push({
        type: 'TIP',
        title: 'Budget in Great Shape! 🎉',
        description: `You have ₹${remaining.toLocaleString('en-IN')} unallocated budget remaining (${Math.round(100 - utilization)}% buffer). You have room for premium dining or special excursions!`,
      });
    }
  }

  return recommendations;
};
