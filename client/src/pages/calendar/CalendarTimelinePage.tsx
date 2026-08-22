import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import { Trip, TripStop, ItinerarySection } from '../../types';
import { TripHeaderTabs } from '../../components/trips/TripHeaderTabs';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/LoadingSkeleton';
import { formatCurrency } from '../../utils/formatters';
import { AddSectionModal } from '../../components/trips/AddSectionModal';
import { itineraryService } from '../../services/itineraryService';
import { useToast } from '../../context/ToastContext';
import {
  Calendar as CalendarIcon,
  Clock,
  Plane,
  Building,
  Sparkles,
  Utensils,
  Layers,
  Plus,
} from 'lucide-react';
import { eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns';

export const CalendarTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [sections, setSections] = useState<ItinerarySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [targetDateForAdd, setTargetDateForAdd] = useState<string>('');

  const fetchCalendarData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await tripService.getTripById(id);
      setTrip(data.trip);
      setStops(data.stops);
      setSections(data.sections);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [id]);

  const handleSaveSection = async (data: any) => {
    if (!id) return;
    const created = await itineraryService.addSection(id, data);
    setSections((prev) => [...prev, created]);
    showToast('success', 'Event added to timeline!');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error || 'Failed to load calendar'} onRetry={fetchCalendarData} />
      </div>
    );
  }

  const tripDays = eachDayOfInterval({
    start: parseISO(trip.startDate.toString()),
    end: parseISO(trip.endDate.toString()),
  });

  const typeConfig: Record<string, { icon: any; color: string; badge: any; bg: string }> = {
    Travel: { icon: Plane, color: 'text-[#017E84]', badge: 'teal', bg: 'bg-[#EAF5F5] border-[#B0DCDE]' },
    Hotel: { icon: Building, color: 'text-[#714B67]', badge: 'primary', bg: 'bg-[#F4EEF3] border-[#E5E1E4]' },
    Activity: { icon: Sparkles, color: 'text-[#5F7F9B]', badge: 'info', bg: 'bg-[#EFF4F8] border-[#D0DFEB]' },
    Meals: { icon: Utensils, color: 'text-[#B8893D]', badge: 'warning', bg: 'bg-[#FCF7ED] border-[#F3E3C7]' },
    Other: { icon: Layers, color: 'text-[#6F6A70]', badge: 'secondary', bg: 'bg-[#F7F7F6] border-[#E5E1E4]' },
  };

  const filteredSections = selectedFilter === 'ALL'
    ? sections
    : sections.filter((s) => s.type === selectedFilter);

  const filters = [
    { label: 'All Events', value: 'ALL' },
    { label: 'Travel', value: 'Travel' },
    { label: 'Stays / Hotels', value: 'Hotel' },
    { label: 'Activities', value: 'Activity' },
    { label: 'Meals & Dining', value: 'Meals' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F6] pb-16">
      {/* Header Tabs */}
      <TripHeaderTabs trip={trip} onTripUpdate={setTrip} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Timeline Control Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E1E4] p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2F2930] flex items-center gap-2 font-display">
              <CalendarIcon className="w-5 h-5 text-[#714B67]" />
              Calendar Timeline Schedule
            </h2>
            <p className="text-xs text-[#6F6A70] font-medium">
              Sequential timeline across all {tripDays.length} journey days
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === f.value
                    ? 'bg-[#714B67] text-white shadow-2xs'
                    : 'bg-[#F4EEF3] text-[#6F6A70] hover:bg-[#EAE1E8] hover:text-[#2F2930]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Day Stream */}
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-8 sm:before:left-10 before:w-0.5 before:bg-[#E5E1E4] before:rounded-full">
          {tripDays.map((dayDate, dayIdx) => {
            const dayIso = format(dayDate, 'yyyy-MM-dd');
            const dayEvents = filteredSections.filter((s) => isSameDay(parseISO(s.date.toString()), dayDate));
            const dayCost = dayEvents.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

            const activeStop = stops.find((st) => {
              const s = new Date(st.startDate);
              const e = new Date(st.endDate);
              return dayDate >= s && dayDate <= e;
            });

            return (
              <div key={dayIso} className="relative flex items-start gap-4 sm:gap-6 group">
                {/* Timeline Day Badge Node */}
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-white border-2 border-[#714B67] shadow-xs flex flex-col items-center justify-center shrink-0 z-10 text-[#2F2930]">
                  <span className="text-[10px] uppercase font-black text-[#714B67] leading-tight">
                    {format(dayDate, 'MMM')}
                  </span>
                  <span className="text-xl sm:text-2xl font-black leading-none font-display text-[#2F2930]">
                    {format(dayDate, 'dd')}
                  </span>
                  <span className="text-[9px] text-[#6F6A70] font-bold leading-tight mt-0.5">
                    {format(dayDate, 'EEE')}
                  </span>
                </div>

                {/* Day Card */}
                <div className="flex-1 bg-white rounded-2xl border border-[#E5E1E4] shadow-soft overflow-hidden">
                  <div className="bg-[#F7F7F6] px-5 sm:px-6 py-3.5 border-b border-[#E5E1E4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[#2F2930] font-display">
                        Day {dayIdx + 1}: {format(dayDate, 'EEEE, MMMM d')}
                      </span>
                      {activeStop && (
                        <Badge variant="teal" size="sm">
                          📍 {activeStop.cityId?.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#2F2930] bg-white px-2.5 py-1 rounded-md border border-[#E5E1E4]">
                        Daily: {formatCurrency(dayCost)}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs py-1 px-2.5"
                        onClick={() => {
                          setTargetDateForAdd(dayIso);
                          setIsAddSectionOpen(true);
                        }}
                        leftIcon={<Plus className="w-3 h-3" />}
                      >
                        Add Event
                      </Button>
                    </div>
                  </div>

                  {/* Day Events */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-[#6F6A70] py-3 text-center italic font-medium">
                        No scheduled events for this day.
                      </p>
                    ) : (
                      dayEvents.map((event) => {
                        const current = typeConfig[event.type] || typeConfig.Other;
                        const Icon = current.icon;
                        return (
                          <div
                            key={event._id}
                            className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-[#F7F7F6]/60 border border-[#E5E1E4] hover:bg-white hover:shadow-xs transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border shadow-xs ${current.bg} ${current.color}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Badge variant={current.badge} size="sm">
                                    {event.type}
                                  </Badge>
                                  {event.startTime && (
                                    <span className="text-xs text-[#6F6A70] font-semibold flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-[#6F6A70]" />
                                      {event.startTime} {event.endTime ? `– ${event.endTime}` : ''}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-[#2F2930] font-display">{event.title}</h4>
                                {event.description && (
                                  <p className="text-xs text-[#6F6A70] mt-0.5 leading-relaxed font-medium">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className="text-xs sm:text-sm font-bold text-[#2F2930] shrink-0 bg-white px-2.5 py-1 rounded-md border border-[#E5E1E4]">
                              {formatCurrency(event.estimatedCost)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        onSave={handleSaveSection}
        tripStartDate={trip.startDate.toString()}
        tripEndDate={trip.endDate.toString()}
        stops={stops}
        defaultDate={targetDateForAdd}
      />
    </div>
  );
};
