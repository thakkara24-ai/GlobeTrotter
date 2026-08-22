export type TravelStyle = 'budget' | 'standard' | 'comfortable' | 'premium';

export interface CategoryRates {
  accommodation: number; // per room per night (assumes 2 travelers per room)
  food: number;          // per person per day
  transport: number;     // local transit per person per day
  interCityTransit: number; // per person per inter-city transfer
  activities: number;    // baseline per person per day (if no activities planned)
  shopping: number;      // per person per day
  other: number;         // per person per day
}

export const STYLE_MULTIPLIERS: Record<TravelStyle, number> = {
  budget: 0.75,
  standard: 1.0,
  comfortable: 1.4,
  premium: 2.0,
};

// Daily baseline rates per currency
export const CURRENCY_BASELINES: Record<string, CategoryRates> = {
  USD: {
    accommodation: 80,
    food: 40,
    transport: 20,
    interCityTransit: 50,
    activities: 30,
    shopping: 15,
    other: 10,
  },
  EUR: {
    accommodation: 75,
    food: 38,
    transport: 18,
    interCityTransit: 45,
    activities: 28,
    shopping: 15,
    other: 10,
  },
  GBP: {
    accommodation: 65,
    food: 32,
    transport: 16,
    interCityTransit: 40,
    activities: 25,
    shopping: 12,
    other: 8,
  },
  INR: {
    accommodation: 2500,
    food: 1200,
    transport: 600,
    interCityTransit: 1500,
    activities: 800,
    shopping: 500,
    other: 300,
  },
  JPY: {
    accommodation: 10000,
    food: 5000,
    transport: 2500,
    interCityTransit: 7000,
    activities: 4000,
    shopping: 2000,
    other: 1200,
  },
  AUD: {
    accommodation: 110,
    food: 55,
    transport: 25,
    interCityTransit: 70,
    activities: 40,
    shopping: 20,
    other: 15,
  },
  CAD: {
    accommodation: 100,
    food: 50,
    transport: 22,
    interCityTransit: 60,
    activities: 35,
    shopping: 20,
    other: 12,
  },
};

/**
 * Returns baseline rates for a given currency code, with fallback to USD equivalent.
 */
export function getBaselineRates(currency: string): CategoryRates {
  const code = (currency || 'USD').toUpperCase();
  if (CURRENCY_BASELINES[code]) {
    return CURRENCY_BASELINES[code];
  }
  // Default fallback if unlisted currency
  return CURRENCY_BASELINES.USD;
}
