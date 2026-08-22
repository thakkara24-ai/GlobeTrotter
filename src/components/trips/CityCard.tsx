import React from 'react';
import { City } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MapPin, Star, Plus } from 'lucide-react';

export interface CityCardProps {
  city: City;
  onAddToTrip?: (city: City) => void;
  onSelect?: (city: City) => void;
}

export const CityCard: React.FC<CityCardProps> = ({ city, onAddToTrip, onSelect }) => {
  const costBadgeVariant = {
    Budget: 'success',
    Moderate: 'teal',
    Luxury: 'warning',
  } as const;

  return (
    <div
      onClick={() => onSelect && onSelect(city)}
      className="group relative bg-white rounded-2xl border border-[#E5E1E4] shadow-soft hover:shadow-card transition-all duration-150 overflow-hidden flex flex-col cursor-pointer hover:border-[#714B67]/40"
    >
      <div className="relative h-44 w-full overflow-hidden bg-[#F7F7F6]">
        <img
          src={city.image}
          alt={city.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2F2930]/85 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={costBadgeVariant[city.costIndex] || 'secondary'} size="sm">
            {city.costIndex}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#2F2930] shadow-2xs border border-[#E5E1E4]">
          <Star className="w-3 h-3 fill-[#B8893D] text-[#B8893D]" />
          <span>{city.popularity}%</span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h4 className="text-base font-bold font-display drop-shadow-sm text-white">{city.name}</h4>
          <p className="text-xs text-white/90 flex items-center gap-1 font-medium drop-shadow-xs">
            <MapPin className="w-3 h-3 text-[#EAF5F5]" />
            {city.region}, {city.country}
          </p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <p className="text-xs text-[#6F6A70] line-clamp-2 leading-relaxed font-medium">
          {city.description}
        </p>

        <div className="pt-2.5 border-t border-[#E5E1E4] flex items-center justify-between">
          <span className="text-[11px] text-[#6F6A70] font-semibold">Explore Catalog</span>
          {onAddToTrip && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs py-1 px-3 text-[#714B67] hover:border-[#714B67]"
              onClick={(e) => {
                e.stopPropagation();
                onAddToTrip(city);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Stop
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
