import { Types } from 'mongoose';
import { Trip } from '../models/Trip';
import { ItinerarySection } from '../models/ItinerarySection';
import { BudgetBreakdown } from '../types';
import { generateBudgetRecommendations } from './smartRecommendationService';
import { differenceInCalendarDays, format } from 'date-fns';

export const calculateTripBudget = async (tripId: string | Types.ObjectId): Promise<BudgetBreakdown> => {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new Error('Trip not found');
  }

  const sections = await ItinerarySection.find({ tripId }).sort({ date: 1, order: 1 });

  const totalBudget = trip.budget || 0;
  const estimatedTotal = sections.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const remaining = Math.max(0, totalBudget - estimatedTotal);
  const overBudget = Math.max(0, estimatedTotal - totalBudget);
  const isOverBudget = estimatedTotal > totalBudget;

  const durationDays = Math.max(
    1,
    differenceInCalendarDays(new Date(trip.endDate), new Date(trip.startDate)) + 1
  );
  const averageDailyCost = durationDays > 0 ? Math.round(estimatedTotal / durationDays) : 0;

  // Category Breakdown: Transport, Stay/Hotel, Activities, Meals, Other
  const standardCategories = ['Travel', 'Hotel', 'Activity', 'Meals', 'Other'];
  const categoryMap: Record<string, { amount: number; count: number }> = {};

  standardCategories.forEach((cat) => {
    categoryMap[cat] = { amount: 0, count: 0 };
  });

  sections.forEach((sec) => {
    const cat = standardCategories.includes(sec.type) ? sec.type : 'Other';
    categoryMap[cat].amount += sec.estimatedCost || 0;
    categoryMap[cat].count += 1;
  });

  const categoryBreakdown = standardCategories.map((cat) => {
    const amount = categoryMap[cat].amount;
    const percentage = estimatedTotal > 0 ? Math.round((amount / estimatedTotal) * 100) : 0;
    return {
      category: cat === 'Travel' ? 'Transport' : cat === 'Hotel' ? 'Stay / Hotel' : cat === 'Activity' ? 'Activities' : cat,
      amount,
      percentage,
      count: categoryMap[cat].count,
    };
  });

  // Day-wise Breakdown
  const dailyMap: Record<string, { total: number; items: any[] }> = {};

  sections.forEach((sec) => {
    const dateKey = format(new Date(sec.date), 'yyyy-MM-dd');
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        total: 0,
        items: [],
      };
    }
    dailyMap[dateKey].total += sec.estimatedCost || 0;
    dailyMap[dateKey].items.push({
      id: sec._id.toString(),
      title: sec.title,
      type: sec.type,
      cost: sec.estimatedCost,
      time: sec.startTime || '',
    });
  });

  const dailyBreakdown = Object.keys(dailyMap)
    .sort()
    .map((dateKey) => ({
      date: dateKey,
      formattedDate: format(new Date(dateKey), 'EEE, MMM d'),
      total: dailyMap[dateKey].total,
      items: dailyMap[dateKey].items,
    }));

  const recommendations = await generateBudgetRecommendations(
    trip,
    sections,
    estimatedTotal,
    overBudget
  );

  return {
    totalBudget,
    estimatedTotal,
    remaining,
    overBudget,
    isOverBudget,
    averageDailyCost,
    tripDurationDays: durationDays,
    categoryBreakdown,
    dailyBreakdown,
    recommendations,
  };
};
