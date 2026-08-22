import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cityService } from '../../services/cityService';
import { tripService } from '../../services/tripService';
import { City, Trip } from '../../types';
import { CityCard } from '../../components/trips/CityCard';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { itineraryService } from '../../services/itineraryService';
import { Search, MapPin, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const CityExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [countryFilter, setCountryFilter] = useState('');
  const [costFilter, setCostFilter] = useState('');

  // Add to Trip Modal
  const [selectedCityForTrip, setSelectedCityForTrip] = useState<City | null>(null);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchCities = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await cityService.getCities({
        search: search.trim() || undefined,
        country: countryFilter || undefined,
        costIndex: costFilter || undefined,
      });
      setCities(data.cities);
      setCountries(data.meta.countries || []);
      setRegions(data.meta.regions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load cities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCities();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, countryFilter, costFilter]);

  const handleOpenAddToTrip = async (city: City) => {
    setSelectedCityForTrip(city);
    try {
      const trips = await tripService.getTrips();
      setUserTrips(trips);
      if (trips.length > 0) {
        setSelectedTripId(trips[0]._id);
      }
    } catch {
      showToast('error', 'Please log in to add this city to your trip.');
    }
  };

  const handleConfirmAddToTrip = async () => {
    if (!selectedCityForTrip || !selectedTripId) return;
    setIsAdding(true);
    try {
      const activeTrip = userTrips.find((t) => t._id === selectedTripId);
      if (!activeTrip) return;

      await itineraryService.addStop(selectedTripId, {
        cityId: selectedCityForTrip._id,
        startDate: format(new Date(activeTrip.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(activeTrip.endDate), 'yyyy-MM-dd'),
      });

      showToast('success', `Added ${selectedCityForTrip.name} to "${activeTrip.title}"!`);
      setSelectedCityForTrip(null);
      navigate(`/trips/${selectedTripId}/itinerary`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add city to trip');
    } finally {
      setIsAdding(false);
    }
  };

  const countryOptions = [
    { value: '', label: 'All Countries' },
    ...countries.map((c) => ({ value: c, label: c })),
  ];

  const costOptions = [
    { value: '', label: 'All Cost Tiers' },
    { value: 'Budget', label: 'Budget' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Luxury', label: 'Luxury' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-display font-black text-[#2F2930] tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAF5F5] text-[#017E84] flex items-center justify-center border border-[#B0DCDE] shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          Explore Destinations & Cities
        </h1>
        <p className="text-sm text-[#6F6A70] max-w-2xl font-medium">
          Discover 35+ heritage, coastal, and Himalayan hubs with realistic cost indexes, popularity ratings, and pre-mapped sightseeing activities.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1E4] shadow-soft flex flex-col md:flex-row items-center gap-3.5">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search by city, region, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#6F6A70]" />}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-1/2 md:w-44">
            <Select
              options={countryOptions}
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            />
          </div>
          <div className="w-1/2 md:w-44">
            <Select
              options={costOptions}
              value={costFilter}
              onChange={(e) => setCostFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid of Cities */}
      {error ? (
        <ErrorState message={error} onRetry={fetchCities} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : cities.length === 0 ? (
        <div className="text-center py-16 text-[#6F6A70] bg-white rounded-2xl border border-dashed border-[#E5E1E4] font-medium">
          No destination cities found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cities.map((city) => (
            <CityCard
              key={city._id}
              city={city}
              onAddToTrip={() => handleOpenAddToTrip(city)}
              onSelect={() => navigate(`/explore/activities?cityId=${city._id}`)}
            />
          ))}
        </div>
      )}

      {/* Add To Trip Modal */}
      <Modal
        isOpen={!!selectedCityForTrip}
        onClose={() => setSelectedCityForTrip(null)}
        title={`Add ${selectedCityForTrip?.name} to Trip`}
        description="Select which trip to add this destination to as a stop."
      >
        <div className="space-y-4">
          {userTrips.length === 0 ? (
            <div className="p-4 bg-[#F7F7F6] rounded-xl text-center space-y-3 border border-[#E5E1E4]">
              <p className="text-xs text-[#6F6A70]">You don't have any active trips yet.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedCityForTrip(null);
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
                <Button variant="outline" size="sm" onClick={() => setSelectedCityForTrip(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAddToTrip}
                  isLoading={isAdding}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Destination
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
