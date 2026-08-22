import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import { itineraryService } from '../../services/itineraryService';
import { cityService } from '../../services/cityService';
import { Trip, TripStop, ItinerarySection, Activity } from '../../types';
import { TripHeaderTabs } from '../../components/trips/TripHeaderTabs';
import { ItinerarySectionItem } from '../../components/trips/ItinerarySectionItem';
import { AddSectionModal } from '../../components/trips/AddSectionModal';
import { AddStopModal } from '../../components/trips/AddStopModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { ItinerarySkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateRange } from '../../utils/formatters';
import {
  Plus,
  MapPin,
  Calendar,
  Sparkles,
  AlertTriangle,
  Trash2,
  Edit2,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  eachDayOfInterval,
  format,
  parseISO,
  isSameDay,
  differenceInDays,
} from 'date-fns';

export const ItineraryBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [sections, setSections] = useState<ItinerarySection[]>([]);
  const [suggestedActivities, setSuggestedActivities] = useState<Activity[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [selectedDateForSection, setSelectedDateForSection] = useState<string>('');
  const [editingSection, setEditingSection] = useState<ItinerarySection | null>(null);
  const [editingStop, setEditingStop] = useState<TripStop | null>(null);

  // Delete confirm states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'stop' | 'section';
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: 'section',
    id: '',
    title: '',
  });

  const fetchItineraryData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await tripService.getTripById(id);
      setTrip(data.trip);
      setStops(data.stops);
      setSections(data.sections);

      // Fetch suggested activities for the first stop city if available
      if (data.stops.length > 0 && data.stops[0].cityId?._id) {
        const cityData = await cityService.getCityById(data.stops[0].cityId._id);
        setSuggestedActivities(cityData.activities || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraryData();
  }, [id]);

  // Derived budget info
  const estimatedTotal = sections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
  const plannedBudget = trip?.budget || 0;
  const isOver = estimatedTotal > plannedBudget && plannedBudget > 0;
  const overAmount = Math.max(0, estimatedTotal - plannedBudget);
  const budgetProgress = plannedBudget > 0 ? Math.min(100, Math.round((estimatedTotal / plannedBudget) * 100)) : 0;

  // Generate days array across the entire trip duration
  const tripDays: Date[] = trip
    ? eachDayOfInterval({
        start: parseISO(trip.startDate.toString()),
        end: parseISO(trip.endDate.toString()),
      })
    : [];

  const totalDurationDays = trip ? differenceInDays(parseISO(trip.endDate.toString()), parseISO(trip.startDate.toString())) + 1 : 0;

  // Handlers
  const handleSaveSection = async (data: any) => {
    if (!id) return;
    if (editingSection) {
      const updated = await itineraryService.updateSection(id, editingSection._id, data);
      setSections((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      showToast('success', 'Itinerary item updated!');
    } else {
      const created = await itineraryService.addSection(id, data);
      setSections((prev) => [...prev, created]);
      showToast('success', 'Added to itinerary!');
    }
    setEditingSection(null);
  };

  const handleSaveStop = async (data: any) => {
    if (!id) return;
    if (editingStop) {
      const updated = await itineraryService.updateStop(id, editingStop._id, data);
      setStops((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      showToast('success', 'Stop updated!');
    } else {
      const created = await itineraryService.addStop(id, data);
      setStops((prev) => [...prev, created]);
      showToast('success', `Destination added to trip!`);

      // Refresh suggested activities for this new city
      if (created.cityId?._id) {
        const cityData = await cityService.getCityById(created.cityId._id);
        setSuggestedActivities(cityData.activities || []);
      }
    }
    setEditingStop(null);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      if (deleteConfirm.type === 'section') {
        await itineraryService.deleteSection(id, deleteConfirm.id);
        setSections((prev) => prev.filter((s) => s._id !== deleteConfirm.id));
        showToast('success', 'Item removed');
      } else {
        await itineraryService.deleteStop(id, deleteConfirm.id);
        setStops((prev) => prev.filter((s) => s._id !== deleteConfirm.id));
        showToast('success', 'Stop removed');
      }
    } catch {
      showToast('error', 'Failed to remove');
    } finally {
      setDeleteConfirm({ isOpen: false, type: 'section', id: '', title: '' });
    }
  };

  const handleQuickAddActivity = async (activity: Activity, targetDate: Date) => {
    if (!id) return;
    try {
      const created = await itineraryService.addSection(id, {
        type: 'Activity',
        title: activity.name,
        description: activity.description,
        date: format(targetDate, 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '12:00',
        estimatedCost: activity.cost,
        activityId: activity._id,
      });
      setSections((prev) => [...prev, created]);
      showToast('success', `Added "${activity.name}" (${formatCurrency(activity.cost)}) to schedule!`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add activity');
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error || 'Trip not found'} onRetry={fetchItineraryData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F6] pb-16">
      {/* Header Tabs */}
      <TripHeaderTabs trip={trip} onTripUpdate={setTrip} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT / MAIN TIMELINE COLUMN (8 of 12 cols on desktop) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Multi-City Stops Strip */}
            <div className="bg-white rounded-2xl border border-[#E5E1E4] p-5 sm:p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#017E84]" />
                  <h2 className="text-lg font-bold text-[#2F2930] font-display">Destinations & Stops</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingStop(null);
                    setIsAddStopOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-[#714B67] hover:border-[#714B67]"
                >
                  Add Destination
                </Button>
              </div>

              {stops.length === 0 ? (
                <div className="p-6 bg-[#F7F7F6] rounded-xl text-center border border-dashed border-[#D4CBD3] space-y-2">
                  <p className="text-sm font-semibold text-[#2F2930]">No destination stops added yet.</p>
                  <p className="text-xs text-[#6F6A70]">
                    Add cities (e.g. Udaipur, Jaipur, Goa) to map out your multi-city route.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsAddStopOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add First Destination
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {stops.map((stop, idx) => (
                    <div
                      key={stop._id}
                      className="relative rounded-xl border border-[#E5E1E4] p-3.5 bg-[#F7F7F6]/70 hover:bg-white hover:shadow-xs transition-all duration-150 flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={stop.cityId?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80'}
                          alt={stop.cityId?.name}
                          className="w-12 h-12 rounded-lg object-cover ring-1 ring-[#E5E1E4]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-[#714B67] bg-[#F4EEF3] px-1.5 py-0.5 rounded border border-[#E5E1E4]">
                              Stop {idx + 1}
                            </span>
                            <span className="text-xs text-[#6F6A70]">• {stop.cityId?.costIndex}</span>
                          </div>
                          <h4 className="text-sm font-bold text-[#2F2930] truncate font-display">
                            {stop.cityId?.name}
                          </h4>
                          <p className="text-[11px] text-[#6F6A70] flex items-center gap-1 mt-0.5 font-medium">
                            <Calendar className="w-3 h-3 text-[#6F6A70]" />
                            {formatDateRange(stop.startDate, stop.endDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E1E4]">
                        <span className="text-[11px] font-medium text-[#6F6A70]">
                          {stop.cityId?.region}, {stop.cityId?.country}
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingStop(stop);
                              setIsAddStopOpen(true);
                            }}
                            className="p-1 rounded hover:bg-[#F4EEF3] text-[#6F6A70] hover:text-[#714B67] cursor-pointer"
                            title="Edit Stop"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: 'stop',
                                id: stop._id,
                                title: stop.cityId?.name || 'Stop',
                              })
                            }
                            className="p-1 rounded hover:bg-[#F9EFEF] text-[#B85C5C] cursor-pointer"
                            title="Remove Stop"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Day-by-Day Timeline Schedule */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-[#2F2930] tracking-tight">
                    Day-by-Day Itinerary
                  </h2>
                  <p className="text-xs text-[#6F6A70] font-medium">
                    Sequential schedule across all {tripDays.length} journey days
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/trips/${trip._id}/calendar`)}
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-[#017E84]" />}
                  className="text-[#017E84] hover:border-[#017E84]"
                >
                  Calendar View
                </Button>
              </div>

              {/* Day Stream */}
              <div className="space-y-6">
                {tripDays.map((dayDate, dayIdx) => {
                  const dayIso = format(dayDate, 'yyyy-MM-dd');
                  const daySections = sections.filter((s) => isSameDay(parseISO(s.date.toString()), dayDate));
                  const dayCost = daySections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

                  // Match which stop corresponds to this day
                  const currentStop = stops.find((st) => {
                    const s = new Date(st.startDate);
                    const e = new Date(st.endDate);
                    return dayDate >= s && dayDate <= e;
                  });

                  return (
                    <div
                      key={dayIso}
                      className="bg-white rounded-2xl border border-[#E5E1E4] shadow-soft overflow-hidden transition-all"
                    >
                      {/* Day Header */}
                      <div className="bg-[#F7F7F6] px-5 sm:px-6 py-3.5 border-b border-[#E5E1E4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#714B67] text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                            <span className="text-[9px] uppercase font-bold leading-none">Day</span>
                            <span className="text-xs font-black leading-none">{dayIdx + 1}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-[#2F2930] font-display">
                                {format(dayDate, 'EEEE, MMMM d, yyyy')}
                              </h3>
                              {currentStop && (
                                <Badge variant="teal" size="sm">
                                  📍 {currentStop.cityId?.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6F6A70] font-medium">
                              {daySections.length} scheduled {daySections.length === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-[#2F2930] bg-white px-2.5 py-1 rounded-lg border border-[#E5E1E4]">
                            Subtotal: {formatCurrency(dayCost)}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs py-1 px-2.5"
                            onClick={() => {
                              setEditingSection(null);
                              setSelectedDateForSection(dayIso);
                              setIsAddSectionOpen(true);
                            }}
                            leftIcon={<Plus className="w-3 h-3" />}
                          >
                            Add Item
                          </Button>
                        </div>
                      </div>

                      {/* Day Items List */}
                      <div className="p-4 sm:p-5 space-y-3">
                        {daySections.length === 0 ? (
                          <div className="text-center py-6 text-[#6F6A70] text-xs border border-dashed border-[#E5E1E4] rounded-xl space-y-2">
                            <p className="font-medium">No items scheduled for Day {dayIdx + 1}.</p>
                            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs py-1 text-[#714B67]"
                                onClick={() => {
                                  setEditingSection(null);
                                  setSelectedDateForSection(dayIso);
                                  setIsAddSectionOpen(true);
                                }}
                                leftIcon={<Plus className="w-3.5 h-3.5 text-[#714B67]" />}
                              >
                                Add Activity / Travel / Hotel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          daySections.map((sec) => (
                            <ItinerarySectionItem
                              key={sec._id}
                              section={sec}
                              onEdit={(s) => {
                                setEditingSection(s);
                                setIsAddSectionOpen(true);
                              }}
                              onDelete={(secId) =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'section',
                                  id: secId,
                                  title: sec.title,
                                })
                              }
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Activities Quick-Add Strip */}
            {suggestedActivities.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E1E4] p-5 sm:p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#017E84]" />
                    <h3 className="text-base font-bold text-[#2F2930] font-display">
                      Recommended for Your Destination
                    </h3>
                  </div>
                  <span className="text-xs text-[#6F6A70] font-medium">1-Click Quick Add</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {suggestedActivities.slice(0, 3).map((act) => (
                    <div
                      key={act._id}
                      className="rounded-xl border border-[#E5E1E4] p-3 bg-[#F7F7F6]/70 flex flex-col justify-between space-y-2.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={act.image}
                          alt={act.name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 ring-1 ring-[#E5E1E4]"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#2F2930] line-clamp-1 font-display">{act.name}</h4>
                          <p className="text-[11px] font-bold text-[#714B67] mt-0.5">
                            {formatCurrency(act.cost)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs py-1 text-[#714B67] hover:border-[#714B67]"
                        onClick={() => handleQuickAddActivity(act, tripDays[0] || new Date())}
                        leftIcon={<Plus className="w-3 h-3" />}
                      >
                        Add to Schedule
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT / SIDEBAR TRIP SUMMARY PANEL (4 of 12 cols on desktop) */}
          <div className="lg:col-span-4 space-y-6 sticky top-20">
            
            {/* Trip Financials & Overview Card */}
            <div className="bg-white rounded-2xl border border-[#E5E1E4] p-5 sm:p-6 shadow-soft space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E1E4] pb-3.5">
                <h3 className="text-base font-bold text-[#2F2930] font-display flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#714B67]" />
                  Trip Summary
                </h3>
                <Badge variant={trip.status === 'CONFIRMED' ? 'success' : 'warning'} size="sm">
                  {trip.status}
                </Badge>
              </div>

              {/* Trip stats metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7F7F6] p-3 rounded-xl border border-[#E5E1E4]">
                  <span className="text-[10px] uppercase font-bold text-[#6F6A70]">Duration</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">
                    {totalDurationDays} {totalDurationDays === 1 ? 'Day' : 'Days'}
                  </p>
                </div>
                <div className="bg-[#F7F7F6] p-3 rounded-xl border border-[#E5E1E4]">
                  <span className="text-[10px] uppercase font-bold text-[#6F6A70]">Destinations</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">
                    {stops.length} {stops.length === 1 ? 'City' : 'Cities'}
                  </p>
                </div>
                <div className="bg-[#F7F7F6] p-3 rounded-xl border border-[#E5E1E4]">
                  <span className="text-[10px] uppercase font-bold text-[#6F6A70]">Total Events</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">
                    {sections.length} {sections.length === 1 ? 'Item' : 'Items'}
                  </p>
                </div>
                <div className="bg-[#F7F7F6] p-3 rounded-xl border border-[#E5E1E4]">
                  <span className="text-[10px] uppercase font-bold text-[#6F6A70]">Target Budget</span>
                  <p className="text-sm font-bold text-[#2F2930] mt-0.5">
                    {formatCurrency(plannedBudget)}
                  </p>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-[#E5E1E4]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6F6A70] font-medium">Estimated Total:</span>
                  <span className={`font-black ${isOver ? 'text-[#B85C5C]' : 'text-[#2F2930]'}`}>
                    {formatCurrency(estimatedTotal)}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F7F7F6] rounded-full overflow-hidden border border-[#E5E1E4]/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-[#B85C5C]' : budgetProgress > 85 ? 'bg-[#B8893D]' : 'bg-[#714B67]'
                    }`}
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-[#6F6A70]">{budgetProgress}% spent</span>
                  <span className={isOver ? 'text-[#B85C5C] font-bold' : 'text-[#4F8A68] font-bold'}>
                    {isOver ? `Over by ${formatCurrency(overAmount)}` : `Buffer: ${formatCurrency(plannedBudget - estimatedTotal)}`}
                  </span>
                </div>
              </div>

              {/* Over budget banner if applicable */}
              {isOver && (
                <div className="p-3 bg-[#F9EFEF] border border-[#F0D1D1] rounded-xl text-[#B85C5C] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Over Planned Budget</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Expenses exceed your target by {formatCurrency(overAmount)}. Visit budget view to apply substitutions.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setEditingSection(null);
                    setSelectedDateForSection(tripDays[0] ? format(tripDays[0], 'yyyy-MM-dd') : '');
                    setIsAddSectionOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Itinerary Item
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/trips/${trip._id}/budget`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Budget Breakdown
                </Button>
              </div>
            </div>

            {/* Quick Tips card */}
            <div className="bg-[#EAF5F5] rounded-2xl border border-[#B0DCDE] p-4 space-y-1.5">
              <span className="text-xs font-bold text-[#017E84] flex items-center gap-1.5 font-display">
                <ShieldCheck className="w-4 h-4 text-[#017E84]" /> Itinerary Tip
              </span>
              <p className="text-xs text-[#2F2930]/80 leading-relaxed font-medium">
                Add realistic travel and check-in times between cities so your daily schedule stays comfortable.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Modals */}
      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => {
          setIsAddSectionOpen(false);
          setEditingSection(null);
        }}
        onSave={handleSaveSection}
        tripStartDate={trip.startDate.toString()}
        tripEndDate={trip.endDate.toString()}
        stops={stops}
        editingSection={editingSection}
        defaultDate={selectedDateForSection}
      />

      <AddStopModal
        isOpen={isAddStopOpen}
        onClose={() => {
          setIsAddStopOpen(false);
          setEditingStop(null);
        }}
        onSave={handleSaveStop}
        tripStartDate={trip.startDate.toString()}
        tripEndDate={trip.endDate.toString()}
        editingStop={editingStop}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: 'section', id: '', title: '' })}
        onConfirm={handleConfirmDelete}
        title={`Remove ${deleteConfirm.type === 'stop' ? 'Stop' : 'Itinerary Item'}`}
        message={`Are you sure you want to remove "${deleteConfirm.title}"?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};
