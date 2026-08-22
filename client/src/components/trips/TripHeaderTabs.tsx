import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trip } from '../../types';
import { formatDateRange, formatCurrency } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Calendar,
  Layers,
  PieChart,
  CalendarDays,
  Share2,
  Check,
  TrendingUp,
  Globe,
  Lock,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { useToast } from '../../context/ToastContext';

export interface TripHeaderTabsProps {
  trip: Trip;
  onTripUpdate?: (updatedTrip: Trip) => void;
  isReadOnly?: boolean;
}

export const TripHeaderTabs: React.FC<TripHeaderTabsProps> = ({
  trip,
  onTripUpdate,
  isReadOnly = false,
}) => {
  const location = useLocation();
  const { showToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isTogglingShare, setIsTogglingShare] = useState(false);

  const tabs = [
    { name: 'Trip Overview', path: `/trips/${trip._id}`, icon: Layers },
    { name: 'Itinerary Builder', path: `/trips/${trip._id}/itinerary`, icon: Calendar },
    { name: 'Budget & Cost', path: `/trips/${trip._id}/budget`, icon: PieChart },
    { name: 'Calendar Timeline', path: `/trips/${trip._id}/calendar`, icon: CalendarDays },
  ];

  const handleToggleShare = async () => {
    setIsTogglingShare(true);
    try {
      const res = await tripService.toggleShare(trip._id);
      const updated = { ...trip, isPublic: res.isPublic, shareToken: res.shareToken };
      if (onTripUpdate) onTripUpdate(updated);
      showToast('success', res.isPublic ? 'Trip is now public and shareable!' : 'Trip is now private.');
    } catch {
      showToast('error', 'Failed to update sharing settings.');
    } finally {
      setIsTogglingShare(false);
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/${trip.shareToken || trip._id}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    showToast('success', 'Public share link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-white border-b border-[#E5E1E4] shadow-2xs mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary" size="sm" className="font-bold">
                {trip.status}
              </Badge>
              {trip.isPublic ? (
                <Badge variant="teal" size="sm" className="flex items-center gap-1 font-semibold">
                  <Globe className="w-3 h-3 text-[#017E84]" /> Public
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#6F6A70]" /> Private
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-[#2F2930] tracking-tight">
              {trip.title}
            </h1>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-[#6F6A70] flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-[#2F2930]">
                <Calendar className="w-3.5 h-3.5 text-[#714B67]" />
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium text-[#2F2930]">
                <TrendingUp className="w-3.5 h-3.5 text-[#017E84]" />
                Budget: {formatCurrency(trip.budget)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant={trip.isPublic ? 'outline' : 'secondary'}
                size="sm"
                onClick={handleToggleShare}
                isLoading={isTogglingShare}
                leftIcon={trip.isPublic ? <Globe className="w-3.5 h-3.5 text-[#017E84]" /> : <Lock className="w-3.5 h-3.5" />}
              >
                {trip.isPublic ? 'Make Private' : 'Make Public'}
              </Button>
              {trip.isPublic && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyShareLink}
                  leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                >
                  {isCopied ? 'Link Copied!' : 'Copy Share Link'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {!isReadOnly && (
          <div className="flex items-center gap-1.5 overflow-x-auto mt-6 pt-2 border-t border-[#E5E1E4] no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                    active
                      ? 'bg-[#714B67] text-white shadow-2xs'
                      : 'text-[#6F6A70] hover:text-[#2F2930] hover:bg-[#F4EEF3]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#6F6A70]'}`} />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
