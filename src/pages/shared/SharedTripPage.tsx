import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import { Trip, TripStop, ItinerarySection } from '../../types';
import { ItinerarySectionItem } from '../../components/trips/ItinerarySectionItem';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { ItinerarySkeleton } from '../../components/common/LoadingSkeleton';
import { formatCurrency, formatDateRange } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Compass,
  Calendar,
  MapPin,
  TrendingUp,
  Copy,
  Globe,
} from 'lucide-react';
import { eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns';

export const SharedTripPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [sections, setSections] = useState<ItinerarySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  const fetchSharedTrip = async () => {
    if (!shareToken) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await tripService.getSharedTrip(shareToken);
      setTrip(data.trip);
      setStops(data.stops);
      setSections(data.sections);
    } catch (err: any) {
      setError(err.response?.data?.message || 'This trip is private or does not exist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedTrip();
  }, [shareToken]);

  const handleCloneTrip = async () => {
    if (!isAuthenticated) {
      showToast('info', 'Please sign in to clone this itinerary to your account.');
      navigate('/login');
      return;
    }
    if (!trip) return;

    setIsCloning(true);
    try {
      const cloned = await tripService.createTrip({
        title: `${trip.title} (My Copy)`,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        coverImage: trip.coverImage,
        isPublic: false,
      });

      showToast('success', 'Trip cloned to your account!');
      navigate(`/trips/${cloned._id}/itinerary`);
    } catch {
      showToast('error', 'Failed to clone trip');
    } finally {
      setIsCloning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ItinerarySkeleton />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState message={error || 'Shared trip not found'} onRetry={fetchSharedTrip} />
      </div>
    );
  }

  const tripDays = eachDayOfInterval({
    start: parseISO(trip.startDate.toString()),
    end: parseISO(trip.endDate.toString()),
  });

  const estimatedTotal = sections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F7F6] pb-16">
      {/* Banner */}
      <div className="bg-white border-b border-[#E5E1E4] shadow-2xs mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="teal" size="sm" className="flex items-center gap-1 font-bold">
                  <Globe className="w-3 h-3 text-[#017E84]" /> Public Shared Itinerary
                </Badge>
                <Badge variant="primary" size="sm" className="font-bold">
                  {trip.status}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-display font-black text-[#2F2930] tracking-tight">
                {trip.title}
              </h1>

              {trip.description && (
                <p className="text-xs sm:text-sm text-[#6F6A70] leading-relaxed font-medium">
                  {trip.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs sm:text-sm text-[#6F6A70] pt-1 flex-wrap">
                <span className="flex items-center gap-1.5 font-bold text-[#2F2930]">
                  <Calendar className="w-4 h-4 text-[#714B67]" />
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-bold text-[#2F2930]">
                  <TrendingUp className="w-4 h-4 text-[#017E84]" />
                  Budget: {formatCurrency(trip.budget)}
                </span>
                <span>•</span>
                <span className="font-bold text-[#2F2930]">{stops.length} Cities</span>
              </div>
            </div>

            {/* Clone CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCloneTrip}
                isLoading={isCloning}
                leftIcon={<Copy className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {isAuthenticated ? 'Clone to My Trips' : 'Sign in to Clone'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Itinerary Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Stops */}
        {stops.length > 0 && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E1E4] shadow-soft space-y-3">
            <h3 className="text-base font-bold text-[#2F2930] flex items-center gap-2 font-display">
              <MapPin className="w-4 h-4 text-[#017E84]" /> Journey Route
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {stops.map((s, idx) => (
                <div key={s._id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#2F2930] bg-[#F7F7F6] px-3 py-1 rounded-lg border border-[#E5E1E4]">
                    {idx + 1}. {s.cityId?.name}
                  </span>
                  {idx < stops.length - 1 && <span className="text-[#6F6A70] text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day-by-Day Stream */}
        <div className="space-y-6">
          <h2 className="text-xl font-display font-bold text-[#2F2930] tracking-tight">
            Shared Daily Itinerary
          </h2>

          {tripDays.map((dayDate, dayIdx) => {
            const dayIso = format(dayDate, 'yyyy-MM-dd');
            const daySections = sections.filter((s) => isSameDay(parseISO(s.date.toString()), dayDate));
            const dayCost = daySections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

            return (
              <div key={dayIso} className="bg-white rounded-2xl border border-[#E5E1E4] shadow-soft overflow-hidden">
                <div className="bg-[#F7F7F6] px-5 sm:px-6 py-3.5 border-b border-[#E5E1E4] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#714B67] text-white text-xs font-bold flex items-center justify-center">
                      {dayIdx + 1}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[#2F2930] font-display">
                      {format(dayDate, 'EEEE, MMMM d')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#2F2930] bg-white px-2.5 py-1 rounded-md border border-[#E5E1E4]">
                    Subtotal: {formatCurrency(dayCost)}
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  {daySections.length === 0 ? (
                    <p className="text-xs text-[#6F6A70] py-2 text-center italic font-medium">
                      No activities planned for this day.
                    </p>
                  ) : (
                    daySections.map((sec) => (
                      <ItinerarySectionItem key={sec._id} section={sec} isReadOnly />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
