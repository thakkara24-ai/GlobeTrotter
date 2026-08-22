import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import { Trip, TripStop, ItinerarySection } from '../../types';
import { TripHeaderTabs } from '../../components/trips/TripHeaderTabs';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/LoadingSkeleton';
import { formatCurrency, formatDateRange } from '../../utils/formatters';
import {
  Calendar,
  PieChart,
  MapPin,
  ArrowRight,
  TrendingUp,
  Share2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [sections, setSections] = useState<ItinerarySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrip = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await tripService.getTripById(id);
      setTrip(data.trip);
      setStops(data.stops);
      setSections(data.sections);
    } catch (err: any) {
      setError(err.message || 'Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error || 'Trip not found'} onRetry={fetchTrip} />
      </div>
    );
  }

  const estimatedTotal = sections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
  const isOver = estimatedTotal > trip.budget && trip.budget > 0;

  return (
    <div className="min-h-screen bg-[#F7F7F6] pb-16">
      <TripHeaderTabs trip={trip} onTripUpdate={setTrip} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Quick Access Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Itinerary Builder */}
          <div
            onClick={() => navigate(`/trips/${trip._id}/itinerary`)}
            className="group bg-white rounded-2xl p-6 border border-[#E5E1E4] shadow-soft hover:shadow-card transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 hover:border-[#714B67]/40"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-[#F4EEF3] text-[#714B67] flex items-center justify-center shadow-2xs border border-[#E5E1E4]">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#2F2930] font-display group-hover:text-[#714B67] transition-colors">
                Itinerary Builder
              </h3>
              <p className="text-xs text-[#6F6A70] leading-relaxed font-medium">
                Add city stops, flights, hotels, and tourist activities with precise times and costs.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E5E1E4] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2F2930]">
                {stops.length} Stops • {sections.length} Activities
              </span>
              <span className="text-xs font-bold text-[#714B67] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Builder <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 2. Smart Budget Engine */}
          <div
            onClick={() => navigate(`/trips/${trip._id}/budget`)}
            className="group bg-white rounded-2xl p-6 border border-[#E5E1E4] shadow-soft hover:shadow-card transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 hover:border-[#714B67]/40"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F5] text-[#017E84] flex items-center justify-center shadow-2xs border border-[#B0DCDE]">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#2F2930] font-display group-hover:text-[#714B67] transition-colors">
                Smart Budget Engine
              </h3>
              <p className="text-xs text-[#6F6A70] leading-relaxed font-medium">
                Analyze expenses by category, view daily burn rates, and apply 1-click optimization recommendations.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E5E1E4] flex items-center justify-between">
              <span className={`text-xs font-bold ${isOver ? 'text-[#B85C5C]' : 'text-[#4F8A68]'}`}>
                {formatCurrency(estimatedTotal)} / {formatCurrency(trip.budget)}
              </span>
              <span className="text-xs font-bold text-[#714B67] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Budget <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 3. Calendar Timeline */}
          <div
            onClick={() => navigate(`/trips/${trip._id}/calendar`)}
            className="group bg-white rounded-2xl p-6 border border-[#E5E1E4] shadow-soft hover:shadow-card transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 hover:border-[#714B67]/40"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-[#EFF4F8] text-[#5F7F9B] flex items-center justify-center shadow-2xs border border-[#D0DFEB]">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#2F2930] font-display group-hover:text-[#714B67] transition-colors">
                Calendar Timeline
              </h3>
              <p className="text-xs text-[#6F6A70] leading-relaxed font-medium">
                Interactive chronological stream of all flights, check-ins, and scheduled activities.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E5E1E4] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2F2930]">
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
              <span className="text-xs font-bold text-[#714B67] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Calendar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Trip Overview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E1E4] shadow-soft space-y-4">
              <h2 className="text-lg font-bold text-[#2F2930] font-display">About this Journey</h2>
              <p className="text-xs sm:text-sm text-[#6F6A70] leading-relaxed font-medium">
                {trip.description || 'No description provided for this trip yet. Use the itinerary builder to organize stops and activities.'}
              </p>

              <div className="pt-4 border-t border-[#E5E1E4] grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#6F6A70] uppercase">Status</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">{trip.status}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#6F6A70] uppercase">Destinations</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">{stops.length} Cities</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#6F6A70] uppercase">Total Cost</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">{formatCurrency(estimatedTotal)}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#6F6A70] uppercase">Visibility</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">{trip.isPublic ? 'Public' : 'Private'}</p>
                </div>
              </div>
            </div>

            {/* Destinations list */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E1E4] shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#2F2930] font-display">Route & Destinations</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/trips/${trip._id}/itinerary`)}
                  className="text-[#714B67] hover:border-[#714B67]"
                >
                  Edit Stops
                </Button>
              </div>

              {stops.length === 0 ? (
                <p className="text-xs text-[#6F6A70] py-4 text-center font-medium">No stops added yet.</p>
              ) : (
                <div className="space-y-3">
                  {stops.map((stop, idx) => (
                    <div
                      key={stop._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F6] border border-[#E5E1E4]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-[#714B67] text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#2F2930] font-display">
                            {stop.cityId?.name}
                          </h4>
                          <p className="text-[11px] text-[#6F6A70] font-medium">
                            {stop.cityId?.region}, {stop.cityId?.country}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[#6F6A70] font-medium">
                        {formatDateRange(stop.startDate, stop.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Action card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E1E4] shadow-soft space-y-4">
              <h3 className="text-base font-bold text-[#2F2930] font-display">Next Steps</h3>
              <p className="text-xs text-[#6F6A70] leading-relaxed font-medium">
                Keep organizing your schedule, look at budget recommendations, or share with friends.
              </p>
              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(`/trips/${trip._id}/itinerary`)}
                >
                  Continue Planning
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/explore/activities')}
                >
                  Find Activities
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
