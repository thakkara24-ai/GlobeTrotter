import { Document, Types } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  languagePreference: string;
  savedDestinations: Types.ObjectId[];
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface ITrip extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  coverImage?: string;
  isPublic: boolean;
  shareToken: string;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITripStop extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  cityId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ItinerarySectionType = 'Travel' | 'Hotel' | 'Activity' | 'Meals' | 'Other';

export interface IItinerarySection extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  stopId?: Types.ObjectId;
  type: ItinerarySectionType;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  estimatedCost: number;
  activityId?: Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICity extends Document {
  _id: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
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

export interface IActivity extends Document {
  _id: Types.ObjectId;
  name: string;
  cityId: Types.ObjectId;
  category: ActivityCategory;
  description: string;
  cost: number;
  duration: number; // in hours or minutes
  image: string;
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityPost extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tripId?: Types.ObjectId;
  title: string;
  content: string;
  destination: string;
  images: string[];
  likes: Types.ObjectId[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
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
  recommendations: {
    type: 'WARNING' | 'TIP' | 'SUBSTITUTION' | 'TRIM';
    title: string;
    description: string;
    savingsAmount?: number;
    targetItemId?: string;
    suggestedItemId?: string;
  }[];
}
