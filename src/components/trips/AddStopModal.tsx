import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SearchableCityPicker } from '../common/SearchableCityPicker';
import { TripStop, City } from '../../types';
import { Calendar } from 'lucide-react';

export interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  tripStartDate: string;
  tripEndDate: string;
  editingStop?: TripStop | null;
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tripStartDate,
  tripEndDate,
  editingStop,
}) => {
  const [selectedCityId, setSelectedCityId] = useState('');
  const [startDate, setStartDate] = useState(tripStartDate);
  const [endDate, setEndDate] = useState(tripEndDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingStop) {
      setSelectedCityId(editingStop.cityId?._id || '');
      setStartDate(editingStop.startDate ? editingStop.startDate.toString().split('T')[0] : tripStartDate);
      setEndDate(editingStop.endDate ? editingStop.endDate.toString().split('T')[0] : tripEndDate);
    } else {
      setSelectedCityId('');
      setStartDate(tripStartDate);
      setEndDate(tripEndDate);
    }
  }, [editingStop, isOpen, tripStartDate, tripEndDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityId) {
      setError('Please select a destination city from the catalog');
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

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        cityId: selectedCityId,
        startDate,
        endDate,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save stop');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingStop ? 'Edit Destination Stop' : 'Add Destination to Trip'}
      description="Pick a city and set the duration of your stay."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#F9EFEF] border border-[#F0D1D1] text-[#B85C5C] text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        <SearchableCityPicker
          selectedCityId={selectedCityId}
          onSelectCity={(city: City) => setSelectedCityId(city._id)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Input
            label="Stop Arrival Date"
            type="date"
            min={tripStartDate}
            max={tripEndDate}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />

          <Input
            label="Stop Departure Date"
            type="date"
            min={startDate || tripStartDate}
            max={tripEndDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />
        </div>

        <div className="flex gap-2.5 justify-end pt-3 border-t border-[#E5E1E4]">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {editingStop ? 'Save Changes' : 'Add Destination'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
