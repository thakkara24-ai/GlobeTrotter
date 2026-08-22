export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  languagePreference?: string;
  savedDestinations?: string[] | City[];
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface City {
  _id: string;
  name: string;
  country: string;
  region: string;
  description: string;
  costIndex: 'Budget' | 'Moderate' | 'Luxury';
  popularity: number;
  image: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'beach'
  | 'museum'
  | 'adventure'
  | 'culture'
  | 'entertainment'
  | 'nature';

export interface Activity {
  _id: string;
  name: string;
  cityId: string | City;
  category: ActivityCategory;
  description: string;
  cost: number;
  duration: number;
  image: string;
  popularity: number;
}

export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  _id: string;
  userId: string | User;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: number;
  coverImage?: string;
  isPublic: boolean;
  shareToken?: string;
  status: TripStatus;
  stopsCount?: number;
  stops?: TripStop[];
  estimatedTotal?: number;
  isOverBudget?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripStop {
  _id: string;
  tripId: string;
  cityId: City;
  startDate: string;
  endDate: string;
  order: number;
}

export type ItinerarySectionType = 'Travel' | 'Hotel' | 'Activity' | 'Meals' | 'Other';

export interface ItinerarySection {
  _id: string;
  tripId: string;
  stopId?: string;
  type: ItinerarySectionType;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  estimatedCost: number;
  activityId?: Activity;
  order: number;
}

export interface BudgetRecommendation {
  type: 'WARNING' | 'TIP' | 'SUBSTITUTION' | 'TRIM';
  title: string;
  description: string;
  savingsAmount?: number;
  targetItemId?: string;
  suggestedItemId?: string;
}

export interface BudgetBreakdown {
  totalBudget: number;
  estimatedTotal: number;
  remaining: number;
  overBudget: number;
  isOverBudget: boolean;
  averageDailyCost: number;
  tripDurationDays: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }[];
  dailyBreakdown: {
    date: string;
    formattedDate: string;
    total: number;
    items: {
      id: string;
      title: string;
      type: string;
      cost: number;
      time?: string;
    }[];
  }[];
  recommendations: BudgetRecommendation[];
}

export interface CommunityPost {
  _id: string;
  userId: User;
  tripId?: Trip;
  title: string;
  content: string;
  destination: string;
  images: string[];
  likes: string[];
  tags: string[];
  createdAt: string;
}
