import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import { Trip } from '../../types';
import { TripCard } from '../../components/trips/TripCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { TripCardSkeleton } from '../../components/common/LoadingSkeleton';
import { Plus, Search } from 'lucide-react';

export const MyTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_desc');

  const fetchTrips = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await tripService.getTrips({
        search: search.trim() || undefined,
        status: statusFilter,
        sort: sortBy,
      });
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrips();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortBy]);

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PLANNING', label: 'In Planning' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const sortOptions = [
    { value: 'created_desc', label: 'Recently Created' },
    { value: 'date_asc', label: 'Upcoming Trip Date' },
    { value: 'budget_high', label: 'Budget: High to Low' },
    { value: 'budget_low', label: 'Budget: Low to High' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-black text-[#2F2930] tracking-tight">My Trips</h1>
          <p className="text-sm text-[#6F6A70] font-medium">
            Manage your personal travel plans, multi-city itineraries, and budget allocations.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/trips/new')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Plan New Trip
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1E4] shadow-soft flex flex-col md:flex-row items-center gap-3">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search trips by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#6F6A70]" />}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-1/2 md:w-44">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-1/2 md:w-48">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Trip Grid */}
      {error ? (
        <ErrorState message={error} onRetry={fetchTrips} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          title="No trips found"
          description={search ? "No trips matched your search query. Try clearing the filter." : "You haven't created any trips yet. Start building your next adventure!"}
          actionText="Create a Trip"
          onAction={() => navigate('/trips/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard
              key={trip._id}
              trip={trip}
              onDelete={(deletedId) => setTrips((prev) => prev.filter((t) => t._id !== deletedId))}
            />
          ))}
        </div>
      )}
    </div>
  );
};
