import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import { cityService } from '../../services/cityService';
import { Trip, City } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TripCard } from '../../components/trips/TripCard';
import { CityCard } from '../../components/trips/CityCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { TripCardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Compass,
  Plus,
  Calendar,
  MapPin,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Plane,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [featuredCities, setFeaturedCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [tripsData, citiesData] = await Promise.all([
        tripService.getTrips(),
        cityService.getCities({ sort: 'popularity' }),
      ]);
      setTrips(tripsData);
      setFeaturedCities(citiesData.cities.slice(0, 4));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalPlannedBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
  const totalEstimatedSpent = trips.reduce((sum, t) => sum + (t.estimatedTotal || 0), 0);
  const activeTripsCount = trips.filter((t) => t.status === 'PLANNING' || t.status === 'CONFIRMED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 1. Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[#F4EEF3] border border-[#E5E1E4] p-6 sm:p-10 shadow-soft">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white text-xs font-bold text-[#714B67] border border-[#E5E1E4] shadow-2xs">
            <Plane className="w-3.5 h-3.5 text-[#017E84]" />
            <span>Multi-City Travel Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight leading-tight text-[#2F2930]">
            Welcome back, {user?.name?.split(' ')[0] || 'Traveler'}
          </h1>

          <p className="text-sm sm:text-base text-[#6F6A70] leading-relaxed max-w-xl font-medium">
            Plan multi-city stops, build day-by-day itineraries, track budgets in real-time, and share travel plans with friends.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/trips/new')}
              leftIcon={<Plus className="w-5 h-5" />}
              className="font-bold shadow-2xs hover:shadow-xs"
            >
              Plan New Trip
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/explore/cities')}
              leftIcon={<Compass className="w-5 h-5 text-[#017E84]" />}
              className="text-[#017E84] hover:border-[#017E84]"
            >
              Explore Destinations
            </Button>
          </div>
        </div>

        {/* Subtle decorative motif */}
        <div className="absolute right-6 top-6 opacity-10 text-[#714B67] pointer-events-none hidden lg:block">
          <Compass className="w-56 h-56" />
        </div>
      </div>

      {/* 2. Key Travel Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">Total Trips</span>
            <div className="p-2 rounded-xl bg-[#F4EEF3] text-[#714B67] border border-[#E5E1E4]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-[#2F2930]">{trips.length}</p>
          <p className="text-xs text-[#6F6A70] mt-1 font-medium">{activeTripsCount} active / in planning</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">Planned Budget</span>
            <div className="p-2 rounded-xl bg-[#EDF5F0] text-[#4F8A68] border border-[#C6E2D1]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-[#2F2930]">{formatCurrency(totalPlannedBudget)}</p>
          <p className="text-xs text-[#6F6A70] mt-1 font-medium">Across all itineraries</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">Estimated Total</span>
            <div className="p-2 rounded-xl bg-[#EAF5F5] text-[#017E84] border border-[#B0DCDE]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-[#2F2930]">{formatCurrency(totalEstimatedSpent)}</p>
          <p className="text-xs text-[#6F6A70] mt-1 font-medium">Calculated from schedule items</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">Destinations</span>
            <div className="p-2 rounded-xl bg-[#FCF7ED] text-[#B8893D] border border-[#F3E3C7]">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-[#2F2930]">
            {featuredCities.length > 0 ? `35+` : '0'}
          </p>
          <p className="text-xs text-[#6F6A70] mt-1 font-medium">Pan-India & international hubs</p>
        </div>
      </div>

      {/* 3. Upcoming Trips */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-[#2F2930] tracking-tight">Your Trips</h2>
            <p className="text-xs text-[#6F6A70] font-medium">Manage and review your saved itineraries</p>
          </div>
          {trips.length > 0 && (
            <Link
              to="/trips"
              className="text-xs font-bold text-[#714B67] hover:text-[#5A3A52] flex items-center gap-1 group"
            >
              View All ({trips.length}) <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchDashboardData} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TripCardSkeleton />
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            title="No trips created yet"
            description="Create your first adventure by choosing travel dates, target budget, and multi-city stops."
            actionText="Plan Your First Trip"
            onAction={() => navigate('/trips/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.slice(0, 3).map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                onDelete={(deletedId) => setTrips((prev) => prev.filter((t) => t._id !== deletedId))}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Featured Pan-India Destinations */}
      <div className="space-y-5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-[#2F2930] tracking-tight">
              Featured Destinations
            </h2>
            <p className="text-xs text-[#6F6A70] font-medium">Top multi-stop travel hubs in the catalog</p>
          </div>
          <Link
            to="/explore/cities"
            className="text-xs font-bold text-[#714B67] hover:text-[#5A3A52] flex items-center gap-1 group"
          >
            Explore All 35+ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCities.map((city) => (
            <CityCard
              key={city._id}
              city={city}
              onSelect={() => navigate(`/explore/cities?search=${city.name}`)}
              onAddToTrip={() => {
                if (trips.length > 0) {
                  navigate(`/trips/${trips[0]._id}/itinerary`);
                } else {
                  navigate('/trips/new');
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
