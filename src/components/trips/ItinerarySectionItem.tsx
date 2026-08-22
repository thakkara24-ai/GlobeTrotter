import React from 'react';
import { ItinerarySection } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import {
  Plane,
  Building,
  Sparkles,
  Utensils,
  Layers,
  Clock,
  Trash2,
  Edit2,
} from 'lucide-react';

export interface ItinerarySectionItemProps {
  section: ItinerarySection;
  onEdit?: (section: ItinerarySection) => void;
  onDelete?: (sectionId: string) => void;
  isReadOnly?: boolean;
}

export const ItinerarySectionItem: React.FC<ItinerarySectionItemProps> = ({
  section,
  onEdit,
  onDelete,
  isReadOnly = false,
}) => {
  const typeConfig: Record<string, { icon: any; color: string; bg: string; badge: 'primary' | 'secondary' | 'teal' | 'success' | 'warning' | 'info' | 'danger' }> = {
    Travel: { icon: Plane, color: 'text-[#017E84]', bg: 'bg-[#EAF5F5] border-[#B0DCDE]', badge: 'teal' },
    Hotel: { icon: Building, color: 'text-[#714B67]', bg: 'bg-[#F4EEF3] border-[#E5E1E4]', badge: 'primary' },
    Activity: { icon: Sparkles, color: 'text-[#5F7F9B]', bg: 'bg-[#EFF4F8] border-[#D0DFEB]', badge: 'info' },
    Meals: { icon: Utensils, color: 'text-[#B8893D]', bg: 'bg-[#FCF7ED] border-[#F3E3C7]', badge: 'warning' },
    Other: { icon: Layers, color: 'text-[#6F6A70]', bg: 'bg-[#F7F7F6] border-[#E5E1E4]', badge: 'secondary' },
  };

  const current = typeConfig[section.type] || typeConfig.Other;
  const Icon = current.icon;

  return (
    <div className="group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-white border border-[#E5E1E4] shadow-2xs hover:shadow-soft transition-all duration-150 hover:border-[#714B67]/40">
      {/* Type Icon Badge */}
      <div
        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border shadow-2xs ${current.bg} ${current.color}`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant={current.badge} size="sm">
            {section.type}
          </Badge>
          {section.startTime && (
            <span className="flex items-center gap-1 text-[11px] text-[#6F6A70] font-medium bg-[#F7F7F6] px-2 py-0.5 rounded border border-[#E5E1E4]">
              <Clock className="w-3 h-3 text-[#6F6A70]" />
              {section.startTime} {section.endTime ? `– ${section.endTime}` : ''}
            </span>
          )}
        </div>

        <h4 className="text-sm sm:text-base font-bold text-[#2F2930] leading-snug font-display">{section.title}</h4>

        {section.description && (
          <p className="text-xs text-[#6F6A70] mt-1 line-clamp-2 leading-relaxed font-medium">
            {section.description}
          </p>
        )}
      </div>

      {/* Cost and Actions */}
      <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
        <span className="text-xs sm:text-sm font-bold text-[#2F2930] bg-[#F7F7F6] px-2.5 py-1 rounded-lg border border-[#E5E1E4] shadow-2xs">
          {formatCurrency(section.estimatedCost)}
        </span>

        {!isReadOnly && (
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity mt-2">
            {onEdit && (
              <button
                onClick={() => onEdit(section)}
                className="p-1.5 rounded-lg text-[#6F6A70] hover:text-[#714B67] hover:bg-[#F4EEF3] transition cursor-pointer"
                title="Edit Item"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(section._id)}
                className="p-1.5 rounded-lg text-[#6F6A70] hover:text-[#B85C5C] hover:bg-[#F9EFEF] transition cursor-pointer"
                title="Delete Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
