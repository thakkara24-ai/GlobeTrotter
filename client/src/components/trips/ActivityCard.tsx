import React from 'react';
import { Activity } from '../../types';
import { formatCurrency, formatDuration } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Clock, Plus, Star } from 'lucide-react';

export interface ActivityCardProps {
  activity: Activity;
  onAddToTrip?: (activity: Activity) => void;
  onSelect?: (activity: Activity) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onAddToTrip, onSelect }) => {
  const categoryVariants: Record<string, 'primary' | 'secondary' | 'teal' | 'success' | 'warning' | 'danger' | 'info'> = {
    sightseeing: 'primary',
    food: 'warning',
    beach: 'teal',
    museum: 'secondary',
    adventure: 'danger',
    culture: 'info',
    entertainment: 'primary',
    nature: 'success',
  };

  const cityName = typeof activity.cityId === 'object' && activity.cityId !== null ? activity.cityId.name : '';

  return (
    <div
      onClick={() => onSelect && onSelect(activity)}
      className="group relative bg-white rounded-2xl border border-[#E5E1E4] shadow-soft hover:shadow-card transition-all duration-150 overflow-hidden flex flex-col cursor-pointer hover:border-[#714B67]/40"
    >
      <div className="relative h-40 w-full overflow-hidden bg-[#F7F7F6]">
        <img
          src={activity.image}
          alt={activity.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2F2930]/85 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={categoryVariants[activity.category] || 'secondary'} size="sm">
            {activity.category}
          </Badge>
          {cityName && (
            <Badge variant="outline" size="sm" className="bg-white/95 text-[#2F2930] border-[#E5E1E4]">
              {cityName}
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#2F2930] shadow-2xs border border-[#E5E1E4]">
          <Star className="w-3 h-3 fill-[#B8893D] text-[#B8893D]" />
          <span>{activity.popularity}%</span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-xs font-semibold text-white drop-shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#EAF5F5]" />
            <span>{formatDuration(activity.duration)}</span>
          </div>
          <span className="text-sm font-black text-white drop-shadow-sm">
            {formatCurrency(activity.cost)}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="text-sm font-bold text-[#2F2930] line-clamp-1 group-hover:text-[#714B67] transition-colors font-display">
            {activity.name}
          </h4>
          <p className="text-xs text-[#6F6A70] line-clamp-2 mt-1 leading-relaxed font-medium">
            {activity.description}
          </p>
        </div>

        <div className="pt-2.5 border-t border-[#E5E1E4] flex items-center justify-between">
          <span className="text-xs font-bold text-[#2F2930]">
            {formatCurrency(activity.cost)} <span className="text-[10px] text-[#6F6A70] font-normal">/ person</span>
          </span>
          {onAddToTrip && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs py-1 px-3 text-[#714B67] hover:border-[#714B67]"
              onClick={(e) => {
                e.stopPropagation();
                onAddToTrip(activity);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add to Stop
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
