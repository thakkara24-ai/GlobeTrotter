import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ItinerarySection, TripStop } from '../../types';
import { Clock, IndianRupee } from 'lucide-react';

export interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  tripStartDate: string;
  tripEndDate: string;
  stops: TripStop[];
  editingSection?: ItinerarySection | null;
  defaultDate?: string;
}

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tripStartDate,
  tripEndDate,
  stops,
  editingSection,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Travel' | 'Hotel' | 'Activity' | 'Meals' | 'Other'>('Activity');
  const [date, setDate] = useState(defaultDate || tripStartDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>(1500);
  const [description, setDescription] = useState('');
  const [tripStopId, setTripStopId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSection) {
      setTitle(editingSection.title);
      setType(editingSection.type);
      setDate(editingSection.date ? editingSection.date.toString().split('T')[0] : tripStartDate);
      setStartTime(editingSection.startTime || '09:00');
      setEndTime(editingSection.endTime || '11:00');
      setEstimatedCost(editingSection.estimatedCost || 0);
      setDescription(editingSection.description || '');
      setTripStopId(editingSection.stopId || '');
    } else {
      setTitle('');
      setType('Activity');
      setDate(defaultDate || tripStartDate);
      setStartTime('09:00');
      setEndTime('11:00');
      setEstimatedCost(1500);
      setDescription('');
      setTripStopId(stops.length > 0 ? stops[0]._id : '');
    }
  }, [editingSection, isOpen, defaultDate, tripStartDate, stops]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        title: title.trim(),
        type,
        date,
        startTime,
        endTime,
        estimatedCost: Number(estimatedCost) || 0,
        description: description.trim(),
        stopId: tripStopId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save itinerary item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'Activity', label: 'Activity / Sightseeing' },
    { value: 'Travel', label: 'Travel (Flight / Train / Drive)' },
    { value: 'Hotel', label: 'Hotel & Stay / Check-in' },
    { value: 'Meals', label: 'Meals & Dining' },
    { value: 'Other', label: 'Other Expense' },
  ];

  const stopOptions = [
    { value: '', label: 'General / No specific stop' },
    ...stops.map((s) => ({ value: s._id, label: s.cityId?.name || 'Destination' })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSection ? 'Edit Itinerary Event' : 'Add Item to Itinerary'}
      description="Schedule an event, transit connection, hotel booking, or dining experience."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#F9EFEF] border border-[#F0D1D1] text-[#B85C5C] text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        <Input
          label="Event / Activity Name"
          placeholder="e.g. Flight to Udaipur, City Palace Tour, Hotel Check-in"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Category"
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          />

          <Select
            label="Associated City Stop"
            options={stopOptions}
            value={tripStopId}
            onChange={(e) => setTripStopId(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date"
            type="date"
            min={tripStartDate}
            max={tripEndDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            leftIcon={<Clock className="w-4 h-4" />}
          />

          <Input
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            leftIcon={<Clock className="w-4 h-4" />}
          />
        </div>

        <Input
          label="Estimated Cost (₹ INR)"
          type="number"
          min="0"
          placeholder="0"
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value === '' ? '' : Number(e.target.value))}
          leftIcon={<IndianRupee className="w-4 h-4" />}
          helperText="Automatically tracked in your trip budget."
        />

        <div>
          <label className="block text-xs font-bold text-[#2F2930] mb-1.5 font-display">
            Notes / Booking Reference (Optional)
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-[#E5E1E4] bg-white px-3 py-2 text-sm text-[#2F2930] placeholder-[#6F6A70]/60 focus:border-[#714B67] focus:outline-none focus:ring-1 focus:ring-[#714B67] font-medium"
            placeholder="Reservation codes, meeting points, entry fee tips..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5 justify-end pt-3 border-t border-[#E5E1E4]">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {editingSection ? 'Save Changes' : 'Add to Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
