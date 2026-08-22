import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip } from '../../types';
import { formatCurrency, formatDateRange } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Calendar,
  MapPin,
  Share2,
  Trash2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

export interface TripCardProps {
  trip: Trip;
  onDelete?: (tripId: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const statusVariant = {
    PLANNING: 'warning',
    CONFIRMED: 'success',
    COMPLETED: 'teal',
    CANCELLED: 'danger',
  } as const;

  const estimatedTotal = trip.estimatedTotal || 0;
  const isOver = estimatedTotal > trip.budget && trip.budget > 0;
  const budgetProgress = trip.budget > 0 ? Math.min(100, Math.round((estimatedTotal / trip.budget) * 100)) : 0;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!trip.isPublic) {
        await tripService.toggleShare(trip._id);
      }
      const shareUrl = `${window.location.origin}/shared/${trip.shareToken || trip._id}`;
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      showToast('success', 'Public trip link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('error', 'Failed to share trip.');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await tripService.deleteTrip(trip._id);
      showToast('success', 'Trip deleted successfully');
      setShowDeleteConfirm(false);
      if (onDelete) onDelete(trip._id);
    } catch {
      showToast('error', 'Failed to delete trip');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={() => navigate(`/trips/${trip._id}`)}
        className="group relative bg-white rounded-2xl border border-[#E5E1E4] shadow-soft hover:shadow-card transition-all duration-150 overflow-hidden flex flex-col cursor-pointer hover:border-[#714B67]/40"
      >
        {/* Cover Image Banner */}
        <div className="relative h-44 w-full overflow-hidden bg-[#F7F7F6]">
          <img
            src={trip.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2F2930]/85 via-transparent to-black/20" />

          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={statusVariant[trip.status] || 'secondary'} size="sm">
              {trip.status}
            </Badge>
            {trip.isPublic && (
              <Badge variant="teal" size="sm" className="bg-white/95 border-[#B0DCDE]">
                Public
              </Badge>
            )}
          </div>

          {/* Share & Delete Action icons */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
            <button
              onClick={handleShare}
              title="Share Trip"
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur-xs text-[#2F2930] hover:bg-white hover:text-[#714B67] shadow-2xs transition cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-[#4F8A68]" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              title="Delete Trip"
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur-xs text-[#2F2930] hover:bg-[#F9EFEF] hover:text-[#B85C5C] shadow-2xs transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dates overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-[#EAF5F5]" />
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#2F2930] line-clamp-1 group-hover:text-[#714B67] transition-colors font-display">
              {trip.title}
            </h3>
            {trip.description && (
              <p className="text-xs text-[#6F6A70] line-clamp-2 mt-1 leading-relaxed font-medium">
                {trip.description}
              </p>
            )}

            {/* Stops info */}
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-[#2F2930]">
              <MapPin className="w-3.5 h-3.5 text-[#017E84] shrink-0" />
              <span className="font-bold">
                {trip.stopsCount || (trip.stops ? trip.stops.length : 0)} {(trip.stopsCount === 1 || (trip.stops && trip.stops.length === 1)) ? 'Stop' : 'Stops'}
              </span>
              {trip.stops && trip.stops.length > 0 && (
                <span className="text-[#6F6A70] truncate">
                  ({trip.stops.map((s) => s.cityId?.name || '').filter(Boolean).join(' → ')})
                </span>
              )}
            </div>
          </div>

          {/* Budget progress bar */}
          <div className="pt-3 border-t border-[#E5E1E4] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1 text-[#6F6A70]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Budget: {formatCurrency(trip.budget)}</span>
              </div>
              <div className={isOver ? 'text-[#B85C5C] font-bold flex items-center gap-1' : 'text-[#2F2930] font-bold'}>
                {isOver && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-[#F7F7F6] rounded-full overflow-hidden border border-[#E5E1E4]/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOver ? 'bg-[#B85C5C]' : budgetProgress > 85 ? 'bg-[#B8893D]' : 'bg-[#714B67]'
                }`}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
          </div>

          {/* Card footer CTA */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-xs font-bold text-[#714B67] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Continue Planning <ArrowRight className="w-3.5 h-3.5" />
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs py-1 px-3"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/trips/${trip._id}/itinerary`);
              }}
            >
              Itinerary
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete "${trip.title}"? This action cannot be undone and will remove all stops, activities, and budget items.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
