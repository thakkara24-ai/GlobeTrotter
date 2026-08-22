import React from 'react';
import { Compass, Plus } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Compass className="w-8 h-8 text-[#714B67]" />,
  title,
  description,
  actionText,
  onAction,
  actionIcon = <Plus className="w-4 h-4" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-dashed border-[#D4CBD3] shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-[#F4EEF3] border border-[#E5E1E4] flex items-center justify-center mb-4 shadow-2xs">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#2F2930] mb-1 font-display">{title}</h3>
      <p className="text-xs text-[#6F6A70] max-w-sm mb-5 leading-relaxed font-medium">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
