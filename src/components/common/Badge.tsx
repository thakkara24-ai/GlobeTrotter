import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  className,
}) => {
  const variants = {
    primary: 'bg-[#F4EEF3] text-[#714B67] border-[#E5E1E4]',
    secondary: 'bg-[#F7F7F6] text-[#2F2930] border-[#E5E1E4]',
    teal: 'bg-[#EAF5F5] text-[#017E84] border-[#B0DCDE]',
    success: 'bg-[#EDF5F0] text-[#4F8A68] border-[#C6E2D1]',
    warning: 'bg-[#FCF7ED] text-[#B8893D] border-[#F3E3C7]',
    danger: 'bg-[#F9EFEF] text-[#B85C5C] border-[#F0D1D1]',
    info: 'bg-[#EFF4F8] text-[#5F7F9B] border-[#D0DFEB]',
    outline: 'bg-transparent text-[#6F6A70] border-[#E5E1E4]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
