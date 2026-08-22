import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import {
  Compass,
  Calendar,
  IndianRupee,
  ArrowRight,
} from 'lucide-react';
import { addDays, format } from 'date-fns';

const COVER_PRESETS = [
  {
    name: 'Rajasthan Palaces (Udaipur/Jaipur)',
    url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Goa Coastal Vibes',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Himalayan Snow Peaks (Manali/Ladakh)',
    url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Kerala Emerald Backwaters',
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Taj Mahal & Heritage North',
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Varanasi Spiritual Ghats',
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=80',
  },
];

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const defaultEndStr = format(addDays(new Date(), 5), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [budget, setBudget] = useState<number | ''>(45000);
  const [coverImage, setCoverImage] = useState(COVER_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Trip name is required');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and End date are required');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date');
      return;
    }
    if (Number(budget) < 0) {
      setError('Budget cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const trip = await tripService.createTrip({
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        budget: Number(budget) || 0,
        coverImage,
        isPublic: false,
        status: 'PLANNING',
      });

      showToast('success', `Trip "${trip.title}" created! Let's add stops and activities.`);
      navigate(`/trips/${trip._id}/itinerary`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white rounded-2xl border border-[#E5E1E4] shadow-soft overflow-hidden">
        {/* Banner */}
        <div className="relative h-44 sm:h-52 bg-[#2F2930] overflow-hidden">
          <img
            src={coverImage}
            alt="Trip Cover"
            className="w-full h-full object-cover opacity-75 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2F2930]/90 via-[#2F2930]/40 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6 text-white">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-xs font-bold text-[#EAF5F5] mb-2 border border-white/20">
              <Compass className="w-3.5 h-3.5" /> Multi-City Journey Planner
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">Plan Your New Journey</h1>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-[#F9EFEF] border border-[#F0D1D1] text-[#B85C5C] text-xs font-bold rounded-xl">
              {error}
            </div>
          )}

          {/* Trip Name */}
          <Input
            label="Trip Title"
            placeholder="e.g. Royal Rajasthan Heritage Trail, Goa Monsoon Escape, or Himalayan Odyssey"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Dates & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />

            <Input
              label="End Date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />

            <Input
              label="Planned Budget (₹ INR)"
              type="number"
              min="0"
              step="500"
              placeholder="e.g. 45000"
              value={budget}
              onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
              leftIcon={<IndianRupee className="w-4 h-4" />}
              helperText="Enables automatic smart budget tracking."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#2F2930] mb-1.5 font-display">
              Trip Description (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-[#E5E1E4] bg-white px-3 py-2 text-sm text-[#2F2930] placeholder-[#6F6A70]/60 focus:border-[#714B67] focus:outline-none focus:ring-1 focus:ring-[#714B67] font-medium"
              placeholder="What is the goal of this journey? Notes on travelers, must-visit heritage spots, or food trails..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Cover Photo Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#2F2930] font-display">
              Select Curated Cover Image Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setCoverImage(preset.url)}
                  className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all group text-left cursor-pointer ${
                    coverImage === preset.url
                      ? 'border-[#714B67] ring-2 ring-[#714B67]/30'
                      : 'border-[#E5E1E4] hover:border-[#714B67]/40'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/45 flex items-end p-1.5">
                    <span className="text-[10px] font-bold text-white leading-tight">
                      {preset.name.split('(')[0]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-5 border-t border-[#E5E1E4]">
            <Button variant="outline" type="button" onClick={() => navigate('/trips')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Itinerary Builder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
