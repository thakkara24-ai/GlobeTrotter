import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import { cityService } from '../../services/cityService';
import { tripService } from '../../services/tripService';
import { itineraryService } from '../../services/itineraryService';
import { Activity, City, Trip } from '../../types';
import { ActivityCard } from '../../components/trips/ActivityCard';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const ActivityExplorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState(searchParams.get('cityId') || '');
  const [maxCostFilter, setMaxCostFilter] = useState<string>('');

  // Add to Trip Modal
  const [selectedActivityForTrip, setSelectedActivityForTrip] = useState<Activity | null>(null);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [actData, cityData] = await Promise.all([
        activityService.getActivities({
          search: search.trim() || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          cityId: cityFilter || undefined,
          maxCost: maxCostFilter ? Number(maxCostFilter) : undefined,
        }),
        cityService.getCities(),
      ]);
      setActivities(actData.activities);
      setCities(cityData.cities);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, cityFilter, maxCostFilter]);

  const handleOpenAddToTrip = async (act: Activity) => {
    setSelectedActivityForTrip(act);
    try {
      const trips = await tripService.getTrips();
      setUserTrips(trips);
      if (trips.length > 0) {
        setSelectedTripId(trips[0]._id);
      }
    } catch {
      showToast('error', 'Please log in to add this activity to your trip.');
    }
  };

  const handleConfirmAddToTrip = async () => {
    if (!selectedActivityForTrip || !selectedTripId) return;
    setIsAdding(true);
    try {
      const activeTrip = userTrips.find((t) => t._id === selectedTripId);
      if (!activeTrip) return;

      await itineraryService.addSection(selectedTripId, {
        type: 'Activity',
        title: selectedActivityForTrip.name,
        description: selectedActivityForTrip.description,
        date: format(new Date(activeTrip.startDate), 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '12:00',
        estimatedCost: selectedActivityForTrip.cost,
        activityId: selectedActivityForTrip._id,
      });

      showToast('success', `Added "${selectedActivityForTrip.name}" to "${activeTrip.title}"!`);
      setSelectedActivityForTrip(null);
      navigate(`/trips/${selectedTripId}/itinerary`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add activity');
    } finally {
      setIsAdding(false);
    }
  };

  const categoryOptions = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'sightseeing', label: 'Sightseeing' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'beach', label: 'Beach & Coastal' },
    { value: 'museum', label: 'Museum & Heritage' },
    { value: 'adventure', label: 'Adventure & Outdoors' },
    { value: 'culture', label: 'Culture & Arts' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'nature', label: 'Nature & Parks' },
  ];

  const cityOptions = [
    { value: '', label: 'All Destinations' },
    ...cities.map((c) => ({ value: c._id, label: c.name })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-display font-black text-[#2F2930] tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F4EEF3] text-[#714B67] flex items-center justify-center border border-[#E5E1E4] shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          Explore Activities & Experiences
        </h1>
        <p className="text-sm text-[#6F6A70] max-w-2xl font-medium">
          Browse guided heritage walks, culinary excursions, and adventure sports with real INR prices and estimated durations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1E4] shadow-soft flex flex-col md:flex-row items-center gap-3.5">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search activities or descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#6F6A70]" />}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
          <div className="w-full md:w-40">
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <Select
              options={cityOptions}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1 w-full md:w-32">
            <Input
              type="number"
              placeholder="Max ₹"
              value={maxCostFilter}
              onChange={(e) => setMaxCostFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid of Activities */}
      {error ? (
        <ErrorState message={error} onRetry={fetchActivities} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-[#6F6A70] bg-white rounded-2xl border border-dashed border-[#E5E1E4] font-medium">
          No experiences found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((act) => (
            <ActivityCard
              key={act._id}
              activity={act}
              onAddToTrip={() => handleOpenAddToTrip(act)}
            />
          ))}
        </div>
      )}

      {/* Add To Trip Modal */}
      <Modal
        isOpen={!!selectedActivityForTrip}
        onClose={() => setSelectedActivityForTrip(null)}
        title={`Add "${selectedActivityForTrip?.name}" to Trip`}
        description="Select which trip to schedule this activity into."
      >
        <div className="space-y-4">
          {userTrips.length === 0 ? (
            <div className="p-4 bg-[#F7F7F6] rounded-xl text-center space-y-3 border border-[#E5E1E4]">
              <p className="text-xs text-[#6F6A70]">You don't have any active trips yet.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedActivityForTrip(null);
                  navigate('/trips/new');
                }}
              >
                Create New Trip First
              </Button>
            </div>
          ) : (
            <>
              <Select
                label="Choose Destination Trip"
                options={userTrips.map((t) => ({
                  value: t._id,
                  label: `${t.title} (${format(new Date(t.startDate), 'MMM d')} - ${format(new Date(t.endDate), 'MMM d')})`,
                }))}
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
              />

              <div className="flex gap-2.5 justify-end pt-3 border-t border-[#E5E1E4]">
                <Button variant="outline" size="sm" onClick={() => setSelectedActivityForTrip(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAddToTrip}
                  isLoading={isAdding}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add to Itinerary
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
