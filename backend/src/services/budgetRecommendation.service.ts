import mongoose from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import TripStop from '../models/TripStop';
import ItinerarySection from '../models/ItinerarySection';
import Activity from '../models/Activity';
import Expense from '../models/Expense';
import collaboratorService from './collaborator.service';
import {
  TravelStyle,
  STYLE_MULTIPLIERS,
  getBaselineRates,
} from '../config/budgetBaselines';
import { BudgetRecommendationQueryInput } from '../validators/budgetRecommendation.validator';

export interface BudgetRecommendationResult {
  tripId: string;
  currency: string;
  durationDays: number;
  travelers: number;
  style: TravelStyle;
  recommendation: {
    minimum: number;
    recommended: number;
    comfortable: number;
  };
  dailyBudget: number;
  categories: {
    transport: number;
    accommodation: number;
    food: number;
    activities: number;
    shopping: number;
    other: number;
  };
  alreadySpent: number;
  remainingRecommendedBudget: number;
  overBudget: boolean;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string[];
  factors: string[];
}

class BudgetRecommendationService {
  /**
   * GET /api/trips/:tripId/budget/recommendation
   * Calculates a smart, rule-based budget recommendation for a trip.
   */
  async getBudgetRecommendation(
    tripId: string,
    userId: string,
    options: BudgetRecommendationQueryInput
  ): Promise<BudgetRecommendationResult> {
    // 1. Authorization: Allow OWNER, EDITOR, VIEWER
    const { trip } = await collaboratorService.requireTripAccess(
      tripId,
      userId,
      'VIEWER'
    );

    // 2. Determine trip duration in days
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    let durationDays = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    if (isNaN(durationDays) || durationDays <= 0) {
      durationDays = 1;
    }

    // 3. Determine traveler count
    let travelers = 1;
    if (options.travelers && options.travelers > 0) {
      travelers = options.travelers;
    } else if (trip.travelers && trip.travelers > 0) {
      travelers = trip.travelers;
    }

    // 4. Currency and Style
    const currency = (trip.budget?.currency || 'USD').toUpperCase();
    const style: TravelStyle = options.style || 'standard';
    const styleMultiplier = STYLE_MULTIPLIERS[style] || 1.0;
    const baseRates = getBaselineRates(currency);

    // 5. Destination Cities & Multi-city Detection
    const stops = await TripStop.find({ tripId });
    const cityIds = new Set<string>();
    if (Array.isArray(trip.cities)) {
      trip.cities.forEach((c) => cityIds.add(c.toString()));
    }
    stops.forEach((s) => {
      if (s.cityId) cityIds.add(s.cityId.toString());
    });
    const destinationCount = Math.max(1, cityIds.size);

    // 6. Itinerary Activities & Planned Activity Costs
    const sections = await ItinerarySection.find({ tripId }).populate(
      'activityId'
    );
    let plannedActivitiesCost = 0;
    let plannedActivitiesCount = 0;

    for (const section of sections) {
      if (section.estimatedCost && section.estimatedCost > 0) {
        plannedActivitiesCost += section.estimatedCost;
        plannedActivitiesCount++;
      } else if (
        section.activityId &&
        typeof (section.activityId as any).estimatedCost === 'number'
      ) {
        const cost = (section.activityId as any).estimatedCost;
        if (cost > 0) {
          plannedActivitiesCost += cost;
          plannedActivitiesCount++;
        }
      }
    }

    // Also inspect any unsectioned activities attached directly to trip
    const tripActivities = await Activity.find({
      _id: { $in: trip.activities || [] },
    });
    for (const act of tripActivities) {
      const alreadyCounted = sections.some(
        (s) => s.activityId && s.activityId.toString() === act._id.toString()
      );
      if (!alreadyCounted && act.estimatedCost && act.estimatedCost > 0) {
        plannedActivitiesCost += act.estimatedCost;
        plannedActivitiesCount++;
      }
    }

    // 7. Existing Trip Expenses & Already Spent
    const existingExpenses = await Expense.find({ trip: tripId });
    let alreadySpent = 0;
    for (const exp of existingExpenses) {
      if (exp.amount && exp.amount > 0) {
        alreadySpent += exp.amount;
      }
    }
    alreadySpent = Math.round(alreadySpent * 100) / 100;

    // 8. Historical Spending Patterns from past trips
    const pastExpenses = await Expense.find({
      user: trip.user,
      trip: { $ne: trip._id },
    });
    const hasHistoricalData = pastExpenses.length >= 3;
    let historicalFoodDailyAvg = 0;
    let historicalTransportDailyAvg = 0;

    if (hasHistoricalData) {
      const foodExpenses = pastExpenses.filter((e) => e.category === 'FOOD');
      if (foodExpenses.length > 0) {
        const totalFood = foodExpenses.reduce((sum, e) => sum + e.amount, 0);
        historicalFoodDailyAvg = totalFood / Math.max(1, foodExpenses.length);
      }

      const transportExpenses = pastExpenses.filter(
        (e) => e.category === 'TRANSPORT'
      );
      if (transportExpenses.length > 0) {
        const totalTransport = transportExpenses.reduce(
          (sum, e) => sum + e.amount,
          0
        );
        historicalTransportDailyAvg =
          totalTransport / Math.max(1, transportExpenses.length);
      }
    }

    // 9. Category-wise Calculations
    // Accommodation: Scaled by rooms (2 persons per room) and duration
    const rooms = Math.ceil(travelers / 2);
    const accommodation = Math.round(
      rooms * baseRates.accommodation * durationDays * styleMultiplier
    );

    // Food: Scaled by travelers and duration (weighted with historical if available)
    let effectiveDailyFood = baseRates.food;
    if (hasHistoricalData && historicalFoodDailyAvg > 0) {
      effectiveDailyFood = (baseRates.food + historicalFoodDailyAvg) / 2;
    }
    const food = Math.round(
      travelers * effectiveDailyFood * durationDays * styleMultiplier
    );

    // Transport: Local transit + Inter-city transit between destinations
    const interCityTransfers = Math.max(0, destinationCount - 1);
    const interCityCost =
      interCityTransfers * baseRates.interCityTransit * travelers * styleMultiplier;
    let effectiveDailyTransport = baseRates.transport;
    if (hasHistoricalData && historicalTransportDailyAvg > 0) {
      effectiveDailyTransport =
        (baseRates.transport + historicalTransportDailyAvg) / 2;
    }
    const localTransitCost =
      travelers * effectiveDailyTransport * durationDays * styleMultiplier;
    const transport = Math.round(localTransitCost + interCityCost);

    // Activities: Max between planned activity costs and baseline activity estimate
    const baselineActivities =
      travelers * baseRates.activities * durationDays * styleMultiplier;
    const activities = Math.round(
      Math.max(plannedActivitiesCost, baselineActivities)
    );

    // Shopping & Other
    const shopping = Math.round(
      travelers * baseRates.shopping * durationDays * styleMultiplier
    );
    const other = Math.round(
      travelers * baseRates.other * durationDays * styleMultiplier
    );

    // 10. Totals and Ranges
    const recommended = Math.max(
      1,
      accommodation + food + transport + activities + shopping + other
    );
    const minimum = Math.max(1, Math.round(recommended * 0.7));
    const comfortable = Math.max(minimum, Math.round(recommended * 1.35));
    const dailyBudget = Math.max(1, Math.round(recommended / durationDays));

    const remainingRecommendedBudget = Math.max(
      0,
      Math.round(recommended - alreadySpent)
    );
    const overBudget = alreadySpent > recommended;

    // 11. Confidence Level Assessment
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (hasHistoricalData && (plannedActivitiesCount > 0 || stops.length > 0)) {
      confidence = 'HIGH';
    } else if (
      hasHistoricalData ||
      plannedActivitiesCount > 0 ||
      stops.length > 0 ||
      destinationCount > 1
    ) {
      confidence = 'MEDIUM';
    }

    // 12. Explanation and Factors
    const explanation: string[] = [
      `Trip duration is ${durationDays} day${durationDays > 1 ? 's' : ''}`,
      `${travelers} traveler${travelers > 1 ? 's' : ''} included (${rooms} room${rooms > 1 ? 's' : ''} estimated for accommodation)`,
      `Travel style selected: ${style} (${styleMultiplier}x multiplier applied)`,
    ];

    if (destinationCount > 1) {
      explanation.push(
        `${destinationCount} destination cities planned with inter-city transit buffer`
      );
    }

    if (plannedActivitiesCount > 0) {
      explanation.push(
        `${plannedActivitiesCount} planned activities accounted for in itinerary`
      );
    } else {
      explanation.push(
        `Baseline activity rate applied (${baseRates.activities} ${currency}/person/day)`
      );
    }

    if (hasHistoricalData) {
      explanation.push(
        `Historical spending patterns from ${pastExpenses.length} past expenses applied to refine estimates`
      );
    } else {
      explanation.push(
        `Standard baseline rates applied due to insufficient prior spending history`
      );
    }

    if (alreadySpent > 0) {
      explanation.push(
        `${alreadySpent} ${currency} already recorded in trip expenses`
      );
    }

    const factors: string[] = [
      `${durationDays}-day trip duration`,
      `${travelers} traveler${travelers > 1 ? 's' : ''}`,
      `${style.charAt(0).toUpperCase() + style.slice(1)} travel style`,
      `${destinationCount} destination${destinationCount > 1 ? 's' : ''}`,
      ...(plannedActivitiesCount > 0
        ? [`${plannedActivitiesCount} scheduled activities`]
        : []),
      ...(hasHistoricalData
        ? ['Historical spending data available']
        : ['Standard regional baselines']),
      ...(alreadySpent > 0
        ? [`Existing expenses: ${alreadySpent} ${currency}`]
        : []),
    ];

    return {
      tripId: trip._id.toString(),
      currency,
      durationDays,
      travelers,
      style,
      recommendation: {
        minimum,
        recommended,
        comfortable,
      },
      dailyBudget,
      categories: {
        transport,
        accommodation,
        food,
        activities,
        shopping,
        other,
      },
      alreadySpent,
      remainingRecommendedBudget,
      overBudget,
      confidence,
      explanation,
      factors,
    };
  }
}

export default new BudgetRecommendationService();
